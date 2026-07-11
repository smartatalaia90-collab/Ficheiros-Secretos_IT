const { eleitores, bilhetes_identidade, sequelize} = require('../models');

//001234567LA001

class EleitoresController{
    async verificarEleitor(req, res){

        try{

            const perfilNumberEleitor = 1;

            const { numeroBI } = req.body;


            if(!numeroBI) return res.status(401).json({error: 'Número do bilhete obrigatório'});

            const bilheteVerifyEleitor = await bilhetes_identidade.findOne({
             attributes:[
                [sequelize.fn('pgp_sym_decrypt',
                     sequelize.col('numero_bi_enc'),
                     process.env.MinhaChave),
                     'numero_bi_decriptografado'],

                     'id'
                  ],

                  where:sequelize.where(sequelize.fn('pgp_sym_decrypt',
                     sequelize.col('numero_bi_enc'), process.env.MinhaChave),
                     numeroBI
                    )

            });




            if (!bilheteVerifyEleitor) return res.status(404).json({message: 'Número não encontrado, BI'});


              console.log(bilheteVerifyEleitor);


            const verificar = await eleitores.findOne({where:{ bilhete_id: bilheteVerifyEleitor.id }});

            if (verificar) return res.status(401).json({error:'Perfil de eleitor já registrado!'});


            req.session.eleitor_id = bilheteVerifyEleitor.id;

            req.session.perfilNumberEleitor = perfilNumberEleitor;

            //req.session.biEleitor = bilheteVerifyEleitor.id;
    
            //req.session.perfilNumberEleitor = perfilNumberEleitor;


                return res.status(200).json(verificar);

        }catch(err){

            console.log(err)
            return res.status(401).json({message: 'Erro ao verificar eleitor'});

        }
        
        
    }


    async validarKYCEleitor(req, res){

        try{

            const { ativo } = req.body;

            if(!ativo){
                return res.status(400).json({error: 'Não completou o reconhecimento facial'});
            }

            req.session.KYC = ativo;

           
        return res.status(200).json({message: 'KYC realizado com sucesso!'});
        }catch(error){
            console.log(error)
            return res.status(401).json({message: 'Erro ao validar KYC', error});

        }

     
    }

    

    


    
}

module.exports = new EleitoresController();
