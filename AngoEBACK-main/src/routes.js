const { Router } = require('express');
const path = require('path');
const multer = require('multer');

const bilheteController = require('./controllers/bilheteController');
const perfil_oficial_cne = require('./controllers/perfilOficialcneController');
//const Utilizadores = require('./controllers/utilizadorController');
const utilizador = require('./controllers/utilizadorController');
const credenciaisController = require('./controllers/credenciaisEleitorController');
const eleitor = require('./controllers/eleitoresController');
const candidatos = require('./controllers/candidatosController'); 
const votar = require('./controllers/votosController'); 

const middleware = require('./middlewares/autenticarSessao');

const sessao = require('./controllers/sessaoController');

const routes = Router();

//Modelo

const modeloTensor = require('./service/serviceModelo');

// Modelo Gemini 

const modeloGemini = require('./service/modeloGemini');

//routes.get('/perfiloficial', perfil_oficial_cne.verificarPerfilCNE);
routes.post('/verificar', bilheteController.ValidarBilhetes);
//routes.post('/perfiloficial', perfil_oficial_cne.verificarPerfilCNE);
//routes.get('/usuario', Utilizadores.utilizadorControl);
routes.get('/criarUtilizador', utilizador.cadastrarUtilizadores);

routes.post('/eleitor/auth', eleitor.verificarEleitor);
routes.post('/eleitor/validarKYC', eleitor.validarKYCEleitor);

routes.get('/candidatos', candidatos.MostrarCandidatos);

routes.post('/votar', votar.InserirVotos);

routes.get('/bilhete', middleware, bilheteController.mostarBilhetes);

routes.get('/sessao/validar', sessao.validarRota);

routes.post('/resultadoVotos/Provincias', votar.MostrarVotosProvincia);




routes.post('/enviar/webauthn', credenciaisController.iniciarRegisto);
routes.post('/enviar/webauthn/verificar', credenciaisController.verificarRegisto);

// Rotas de login WebAuthn
routes.post('/enviar/webauthn/iniciar-login', credenciaisController.iniciarLogin);
routes.post('/enviar/webauthn/verificar-login', credenciaisController.verificarLogin);

//Modelo

routes.get('/treinarModelo', modeloTensor.treinarModelo.bind(modeloTensor));
routes.get('/prever', async (req, res)=>{
    try {
        const caminhoImagem = path.join(__dirname, './dataset/validos/7967631_770x433_acf_cropped.jpg');

        const resultado = modeloTensor.prever(caminhoImagem);

        return res.json(resultado);
    } catch (error) {

        console.error(error)


        return res.status(400).json({error: 'Erro ao prever'});
        
    }
});

// Modelos Gemini

const carregarImagem = multer({dest: 'imagensCarregadas/'});

//const sessoes = {};


routes.post('/analisar/imagem', carregarImagem.single('imagem'), async (req, res)=>{

    try {


        // Verifica se há algum ficheiro(imagem)

        if (!req.file) {

            console.log('Nenhuma imagem enviada');

             return res.status(400).json({ erro: "Nenhuma imagem enviada" });
        }
        // Essa é a variável para tirares
        const faceEnviada = req.body.face;

        //const utilizadorId = req.body.utilizadorId

        const fs = require('fs');

        //const sessao = sessoes[utilizadorId] || { etapa: 'frente' };

        // Verificar se o estado da sessão é diferente da foto enviada primeiro 

        /*

        if (sessao.etapa === 'frente' && faceEnviada !== 'frente') {

            fs.unlinkSync(req.file.path);

            return res.status(400).json({ error: 'Tem de enviar primeiro a frente' });
        } 

        // Verificar se a segunda imagem é verso

        if (sessao.etapa === 'verso' && faceEnviada !== 'verso') {

            fs.unlinkSync(req.file.path);

            return res.status(400).json({ error: 'Frente já tirada, agora faça com o verso' });
        }

        */

        

        // Envia aqui
        const resultado = await modeloGemini.VerificarBI(req.file.path);

        fs.unlinkSync(req.file.path);

        //Essa é a verificação para tirares
        if (resultado.face !==  faceEnviada) {

            console.log(`Era esperado a ${faceEnviada} mas foi enviado o ${resultado.face}`);

            return res.status(400).json({
                e_bi_Angolano: false,
                e_original: false,
                error: `Era esperado a ${faceEnviada} mas foi enviado o ${resultado.face}`
            });

        }

        // Atualizar o estado

        
/*
        if (faceEnviada === 'frente') {

            sessoes[utilizadorId] = { etapa: 'verso' };

        }else{

            delete sessoes[utilizadorId];
        }

        */

        
        
      
        console.log(resultado.motivo);

        return res.status(200).json(resultado);

        //const imagem = path.join(__dirname, './1.jpg');
        
        //const enviar = modeloGemini.EnviarImagem(imagem);


       // return res.send("Resultado:", enviar);

    } catch (error) {

        console.error(error)

        
        return res.status(400).json({error: 'Erro ao enviar Imagem'});
        
    }
});




module.exports = routes;
