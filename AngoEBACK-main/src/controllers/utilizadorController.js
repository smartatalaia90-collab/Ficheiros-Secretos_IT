const { utilizador, sequelize } = require('../models'); 

class UtilizadorController{
    async cadastrarUtilizadores(req, res){
        /*
        req.session.bi = bilheteVerify.id;

        req.session.perfilNumber = perfilNumber;

        req.session.kyc = kyc;
        
        */
       try{

        const id_numero_bi = req.session.bi;
        const id_perfil = req.session.perfilNumber;
        const kyc_concluido = req.session.kyc;

        

        if(!id_numero_bi && !id_perfil && !kyc_concluido) return res.status(401).json({error: 'id do número do bilhete, perfil, ou kyc em falta'});

        const verificarCadastro = await utilizador.findOne({where:{id_numero_bi}});

        if (verificarCadastro) return res.status(401).json({message: 'Usuário já cadastrado'});

            const criarUtilizador = await utilizador.create({id_numero_bi, id_perfil, kyc_concluido});
            return res.status(200).json(criarUtilizador)

       } catch(error){

        console.log(error)
            return res.status(400).json({message: 'Erro ao cadastrar utilizador'});
       }
       
    }


    async verUtilizador(req, res){
        const ver = await utilizador.findAll();
        return res.status(200).json(ver);
    }


    async elimiminarUtiizador(req, res){

        const deletar = await utilizador.destroy({
            where:{

                id_utilizador: 1

            }
        })

        return res.status(200).json(deletar);
    }
}

module.exports = new UtilizadorController();












/*const { utilizador } = require('../models');

class UtilizadorController{
    async utilizadorControl(req, res){

        try {

            const id_BI = req.session.idBI;
            const id_perfil =  req.session.id_perfil;
            const kyc = req.session.kyc

            let redirecionar;

            if (!id_BI || !id_perfil || !kyc) {

                return res.status(400).json({message: "requesitos são necessários"})
                
            }


            switch(id_perfil){

                case 1: redirecionar = '/eleitor'; break;
                case 2: redirecionar = '/provincial'; break;
                case 3: redirecionar = '/plenario'; break

                default: redirecionar = '/login';

            }

            console.log(`Redirecionado para ${redirecionar}`);

           // const criarUsuario = await utilizador.create({id_numero_bi: id_BI, id_perfil: id_perfil, kyc: kyc});

            return res.status(200).json({redirecionar});


            
        } catch (error) {

            console.log(error)
            return res.status(400).json({message: "Erro ao criar e a redirecionar", error})
            
        }

     

    }
}


module.exports = new UtilizadorController();

*/