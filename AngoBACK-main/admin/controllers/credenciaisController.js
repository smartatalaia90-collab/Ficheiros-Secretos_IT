const { credenciais, bilhetes_identidade, sequelize } = require('../models');

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const base64url = require('base64url');
const rpName = process.env.rpNAME;
const rpID = process.env.rpID;
const origin = process.env.ORIGIN;

class CredenciaisController {
  async iniciarRegisto(req, res) {
    try {
      console.log('=== INICIANDO REGISTO ===');
      const { numero_bi_enc } = req.body;
      console.log('Número BI recebido:', numero_bi_enc);

      const bilhete = await bilhetes_identidade.findOne({
        where: sequelize.where(
          sequelize.fn('pgp_sym_decrypt', sequelize.col('numero_bi_enc'), process.env.MinhaChave),
          numero_bi_enc
        )
      });

      if (!bilhete) {
        console.log('Bilhete não encontrado');
        return res.status(404).json({ error: 'Bilhete não encontrado' });
      }

      console.log('Bilhete encontrado - ID:', bilhete.id, 'Nome:', bilhete.nome_completo);

      const userIDBytes = new TextEncoder().encode(bilhete.id.toString());
      const options = await generateRegistrationOptions({
        rpName, rpID, userID: userIDBytes,
        userName: bilhete.nome_completo, attestationType: 'none',
      });

      req.session.currentChallenge = options.challenge;
      req.session.bilhete_id = bilhete.id;
      console.log('Sessão atual após salvar challenge:', req.session);
      res.json(options);
    } catch (err) {
      console.error("Erro iniciar registo:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  async verificarRegisto(req, res) {
    try {
      console.log('\n=== INÍCIO verificarRegisto ===');
      console.log('Session ID:', req.sessionID);
      console.log('Sessão completa:', req.session);
      console.log('Expected challenge na sessão:', req.session?.currentChallenge);
      console.log('Bilhete id na sessão:', req.session?.bilhete_id);

      const { credencial } = req.body;
      const expectedChallenge = req.session?.currentChallenge;
      const bilhete_id = req.session?.bilhete_id;

      if (!credencial) {
        console.log('Nenhuma credencial enviada');
        return res.status(400).json({ error: 'Credencial não enviada' });
      }

      if (!expectedChallenge || !bilhete_id) {
        console.log('Sessão inválida: challenge ou bilhete_id ausente');
        return res.status(400).json({ error: 'Sessão inválida' });
      }

      console.log('Verificando se bilhete_id já existe:', bilhete_id);
      const verificarBilhete = await credenciais.findOne({ where: { bilhete_id } });
      if (verificarBilhete) {
        console.log('Bilhete já cadastrado, retornando 401');
        return res.status(401).json({ error: "Bilhete já autenticado" });
      }

      const verification = await verifyRegistrationResponse({
        response: credencial, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        console.log('Falha na verificação da resposta WebAuthn');
        return res.status(400).json({ error: 'Verificação falhou' });
      }

      const cred = verification.registrationInfo.credential;
      const credId = cred.id;
      const publicKey = base64url.encode(Buffer.from(cred.publicKey));
      const counter = verification.registrationInfo.counter ?? 0;

      await credenciais.create({ bilhete_id, credential_id: credId, public_key: publicKey, counter });
      console.log('Credencial salva com sucesso para bilhete_id:', bilhete_id);

      req.session.credId = credId;
      delete req.session.currentChallenge;

      res.json({ success: true, message: 'Credencial registada com sucesso' });
    } catch (err) {
      console.error("Erro verificar registo:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  async iniciarLogin(req, res) {
    try {
      console.log('=== INICIANDO LOGIN ===');
      const credentials = await credenciais.findAll();
      if (credentials.length === 0) {
        console.log('Nenhuma credencial encontrada');
        return res.status(404).json({ error: 'Nenhuma credencial encontrada' });
      }
      const options = await generateAuthenticationOptions({ timeout: 60000, userVerification: 'preferred', rpID });
      req.session.currentChallenge = options.challenge;
      console.log('Desafio de login gerado e salvo na sessão');
      res.json(options);
    } catch (err) {
      console.error("Erro iniciar login:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  async verificarLogin(req, res) {
    try {
      console.log('\n=== VERIFICANDO LOGIN ===');
      const expectedChallenge = req.session?.currentChallenge;
      const body = req.body;
      if (!expectedChallenge) {
        console.log('Sessão inválida - challenge não encontrado');
        return res.status(400).json({ error: 'Sessão inválida' });
      }
      console.log("ID recebido do front:", body.id);
      const userCred = await credenciais.findOne({ where: { credential_id: body.id } });
      if (!userCred) {
        console.log('Credencial não encontrada no banco');
        return res.status(404).json({ error: 'Credencial não encontrada' });
      }
      const publicKeyBuffer = Buffer.from(base64url.toBuffer(userCred.public_key));
      const verification = await verifyAuthenticationResponse({
        response: body, expectedChallenge, expectedOrigin: origin, expectedRPID: rpID,
        credential: { id: userCred.credential_id, publicKey: publicKeyBuffer, counter: userCred.counter || 0 },
      });
      if (!verification.verified) {
        console.log('Falha na verificação biométrica');
        return res.status(400).json({ error: 'Falha na verificação biométrica' });
      }
      if (!req.session.userCred) req.session.userCred = {};
      req.session.userCred.credential_id = userCred.credential_id;
      delete req.session.currentChallenge;
      console.log('Login bem-sucedido para bilhete_id:', userCred.bilhete_id);
      res.json({ success: true, message: 'Login biométrico bem-sucedido', bilhete_id: userCred.bilhete_id });
    } catch (err) {
      console.error("Erro verificar login:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }
}

module.exports = new CredenciaisController();