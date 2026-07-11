const { credenciais, bilhetes_identidade, eleitores, sequelize } = require('../models');

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
  // Iniciar registo
   async iniciarRegisto(req, res) {
    try {
      const { numero_bi_enc } = req.body;

      // Localiza utilizador pelo BI
      const bilhete = await bilhetes_identidade.findOne({
        where: sequelize.where(
          sequelize.fn('pgp_sym_decrypt', sequelize.col('numero_bi_enc'), process.env.MinhaChave),
          numero_bi_enc
        )
      });

      if (!bilhete) {
        return res.status(404).json({ error: 'Bilhete não encontrado' });
      }

      const userIDBytes = new TextEncoder().encode(bilhete.id.toString());

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: userIDBytes,
        userName: bilhete.nome_completo,
        attestationType: 'none',
      });

      req.session.currentChallenge = options.challenge;
        req.session.bilhete_id = bilhete.id;

      res.json(options);
    } catch (err) {
      console.error("Erro iniciar registo:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  // Verificar registo
   async verificarRegisto(req, res) {
  try {
    console.log('=== INÍCIO verificarRegisto ===');
    console.log('Session ID:', req.sessionID);
    console.log('Session atual:', req.session);
    console.log('Expected challenge:', req.session?.currentChallenge);
    console.log('Bilhete id:', req.session?.bilhete_id);

    const { credencial } = req.body;
    const expectedChallenge = req.session?.currentChallenge;
    const bilhete_id = req.session?.bilhete_id;

    if (!expectedChallenge || !bilhete_id) {
      console.log('Sessão inválida: challenge ou bilhete_id ausente');
      return res.status(400).json({ error: 'Sessão inválida' });
    }

      const verification = await verifyRegistrationResponse({
        response: credencial,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'Verificação falhou' });
      }

      const cred = verification.registrationInfo.credential;

      // guarda diretamente o id string
      const credId = cred.id;  
      const publicKey = base64url.encode(Buffer.from(cred.publicKey));
      const counter = verification.registrationInfo.counter ?? 0;

      const verificarBilhete = await credenciais.findOne({ where: { bilhete_id } });

        if (verificarBilhete) {

          return res.status(401).json({ error: "Bilhete já autenticado" });

        }

      
      await credenciais.create({
        bilhete_id,
        credential_id: credId,
        public_key: publicKey,
        counter,
      });
      
      
/*
      const cred = verification.registrationInfo.credential;
      const credId = typeof cred.id === "string" ? cred.id : base64url.encode(Buffer.from(cred.id));
      const publicKey = base64url.encode(Buffer.from(cred.publicKey));
      const counter = verification.registrationInfo.counter ?? 0;

      await credenciais.create({
        bilhete_id,
        credential_id: credId,
        public_key: publicKey,
        counter,
      });
      */

      /*
          const cred = verification.registrationInfo.credential;
const credId = base64url.encode(Buffer.from(cred.id)); // sempre rawId convertido
const publicKey = base64url.encode(Buffer.from(cred.publicKey));
const counter = verification.registrationInfo.counter ?? 0;

await credenciais.create({
  bilhete_id,
  credential_id: credId,
  public_key: publicKey,
  counter,
});
      
    */ 
      //#############################################################################################################################################################################

            if(!req.session.KYC && !req.session.eleitor_id && !req.session.perfilNumberEleitor){
              delete req.session.eleitor_id;
              delete req.session.perfilNumberEleitor;
              return res.status(401).json({error: 'KYC não realizado, ou falhado'});
            }

            const bi = req.session.eleitor_id;

            const perfil = req.session.perfilNumberEleitor;
            const kyc_concluido = req.session.KYC

            req.session.kyc = kyc_concluido;

            async function localization(ip) {

                    try{
  
                          const token = process.env.Token;

                          const resposta = await fetch(`https://ipinfo.io/${ip}?token=${token}`);

                          const dados = await resposta.json();

                          return{
                            cidade: dados.city,
                            provincia: dados.region,
                            pais: dados.country
                          };

                          }

                          catch(err){
                            console.error('Erro ao localizar', err);
                            return null
                          }
                          
            }

            const ip = req.pegarInformacoes?.ip;

                let listaProvincias = [

                    'Luanda',
                    'Bengo',
                    'Benguela',
                    'Bié',
                    'Cabinda',
                    'Cuando Cubango',
                    'Cuanza Norte',
                    'Cuanza Sul',
                    'Cunene',
                    'Huambo',       
                    'Huíla',
                    'Icolo e Bengo',      
                    'Lunda Norte',
                    'Lunda Sul',
                    'Malanje',
                    'Moxico',
                    'Moxico Leste',
                    'Namibe',
                    'Uíge',
                    'Zaire'
             ];


            const provincia = listaProvincias[Math.floor(Math.random() * listaProvincias.length)]



            // Quando estiver em produção

            if (ip !== '127.0.0.0' && ip !== '::1') {


                const localizacao = await localization(ip);

                if (localizacao?.provincia) {


                    const provincia = localizacao?.provincia;

                }
                
            }
        

            console.log(`${provincia}`);


            const criarEleitor = await eleitores.create({bilhete_id:bi, provincia});

             req.session.eleitor_id = criarEleitor.id

             req.session.provincia = criarEleitor.provincia;

      //##############################################################################################################################################################################
      req.session.credId = credId;
      delete req.session.currentChallenge;
     // delete req.session.bilhete_id;

      res.json({ success: true, message: 'Credencial registada com sucesso' });
    } catch (err) {
      console.error("Erro verificar registo:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  // Iniciar login
 
  async iniciarLogin(req, res) {
    try {
      //verificar se existem credenciais na base
      const credentials = await credenciais.findAll();
      if (credentials.length === 0) {
        return res.status(404).json({ error: 'Nenhuma credencial encontrada' });
      }
  
      // Gera opções sem listar todas as credenciais
      const options = await generateAuthenticationOptions({
        timeout: 60000,
        userVerification: 'preferred',
        rpID,
        // não enviar allowCredentials → browser decide
      });
  
      req.session.currentChallenge = options.challenge;
      res.json(options);
    } catch (err) {
      console.error("Erro iniciar login:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }
  
  

  // Verificar login
  async verificarLogin(req, res) {
    try {
      const expectedChallenge = req.session?.currentChallenge;
      const body = req.body;
  
      if (!expectedChallenge) {
        return res.status(400).json({ error: 'Sessão inválida' });
      }

        console.log("ID recebido do front:", body.id);

      // Identifica o utilizador pela credencial enviada
      const userCred = await credenciais.findOne({ where: { credential_id: body.id } });
      if (!userCred) {
        return res.status(404).json({ error: 'Credencial não encontrada' });
      }


      console.log(userCred?.bilhete_id)
  
      const publicKeyBuffer = Buffer.from(base64url.toBuffer(userCred.public_key));
  
      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: userCred.credential_id,
          publicKey: publicKeyBuffer,
          counter: userCred.counter || 0,
        },
      });
  
      if (!verification.verified) {
  return res.status(400).json({ error: 'Falha na verificação biométrica' });
    }

// inicializa objeto se não existir
    if (!req.session.userCred) {

      console.log('Não tem Sessão, mas vai se criar');

      req.session.userCred = {};

    }


      const eleitor = await eleitores.findOne({ where: { bilhete_id: userCred.bilhete_id } }); 

    if (!eleitor) return res.status(404).json({ error: "Eleitor não encontrado" }); 

    req.session.eleitor_id = eleitor.id; // guarda o ID do eleitor 



  req.session.userCred.credential_id = userCred.credential_id;


delete req.session.currentChallenge;

// associa o eleitor à sessão


res.json({ success: true, message: 'Login biométrico bem-sucedido', bilhete_id: userCred.bilhete_id });

    } catch (err) {
      console.error("Erro verificar login:", err);
      res.status(500).json({ error: 'Erro interno' });
    }
  }
  
}

module.exports = new CredenciaisController();
