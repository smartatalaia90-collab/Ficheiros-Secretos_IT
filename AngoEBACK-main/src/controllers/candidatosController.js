const { candidatos  } = require('../models');

class CandidatosController{

	async MostrarCandidatos(req, res){

		try{

			const mostrar = await candidatos.findAll()

			return res.status(200).json(mostrar);

		}
		
		catch(error){

			return res.status(500).json({message: "erro ao mostrar candidatos"});
		}

		
	}
}

module.exports = new CandidatosController();