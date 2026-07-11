const { where } = require('sequelize');
const { bilhetes_identidade, sequelize } = require('../models');

class BilhetesController{

    async ValidarBilhetes(req, res){
        //123456789LA045
        try {

            const { numero_bi_enc } = req.body;

            if (!numero_bi_enc) return res.status(400).json({message:"Número do BI obrigatório"})
               
    
            const VerificarBI = await bilhetes_identidade.findOne({
                attributes: [
                    [sequelize.fn('pgp_sym_decrypt', 
                        sequelize.col('numero_bi_enc'), 
                        process.env.MinhaChave), 
                        'numerosDescriptografados'],

                        'id'
                ],

                where: sequelize.where(
                    sequelize.fn('pgp_sym_decrypt', 
                    sequelize.col('numero_bi_enc'), 
                    process.env.MinhaChave), 
                    numero_bi_enc
                )
            });

            if (!VerificarBI) {
                console.log('Bilhete não encontrado');
                return res.status(400).json({error: "Bilhete não encontrado"})

                 
            }

            //req.session.idBI = VerificarBI.id
            //req.session.bi = numero_bi_enc;

            return res.status(200).json({message:"Bilhete de identidade validado"});

        } catch (error) {
            console.log(error)
            return res.status(404).json({error: "Erro ao procurar bilhetes"});
            
        }



    }




    async mostarBilhetes(req, res){
            
            const criar = await bilhetes_identidade.findAll({

                attributes:[

                    [sequelize.fn('pgp_sym_decrypt', sequelize.col('numero_bi_enc'), process.env.MinhaChave), 'numero_bi_enc'],

                    'id',
                    'nome_completo',
                    'data_nascimento',
                    'genero',
                    'nacionalidade',
                    'data_emissao',
                    'data_validade',
                    'local_emissao',
                    'criado_em'

                ]

            });

            return res.status(200).json(criar);
        }
}

module.exports = new BilhetesController();