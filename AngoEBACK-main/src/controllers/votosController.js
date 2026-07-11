const { votos, eleitores, candidatos, sequelize } = require('../models');

class VotosController {

  // Inserir voto
  async InserirVotos(req, res) {
    try {
      const { candidato_id } = req.body;

      // Pega eleitor da sessão (definido no login/KYC)
      const eleitor_id = req.session.eleitor_id;
      const provincia = req.session.provincia;

      if (!eleitor_id) {
        return res.status(400).json({ error: "Eleitor não autenticado na sessão" });
      }

      // Busca eleitor na base para confirmar existência
      const pegarEleitor = await eleitores.findByPk(eleitor_id);

      if (!pegarEleitor) {
        return res.status(404).json({ error: "Eleitor não encontrado" });
      }

      // Usa provincia da sessão se existir, senão pega do BD
      const provinciaFinal = provincia || pegarEleitor.provincia;

      if (!candidato_id || !provinciaFinal) {
        return res.status(400).json({ error: "Candidato e provincia são necessários" });
      }


      const verificarVoto = await votos.findOne({where:{eleitor_id: pegarEleitor.id}});

      if (verificarVoto) {

        return res.status(400).json({error: "Este eleitor já votou!"});
      }



      // Cria voto
      await votos.create({
        eleitor_id: pegarEleitor.id,
        candidato_id,
        provincia: provinciaFinal
      });

      return res.status(201).json({ success: true, message: "Voto registado com sucesso!" });

    } catch (error) {
      console.error("Erro ao inserir voto:", error);
      return res.status(500).json({ message: "Erro ao inserir voto" });
    }
  }

  // Mostrar votos
  async MostrarVotos(req, res) {
    try {
      const resultado = await candidatos.findAll({
        attributes: [
          'nome',
          'partido',
          [sequelize.fn('COUNT', sequelize.col('votos.id')), 'resultado_total']
        ],
        include: [{
          model: votos,
          attributes: []
        }],
        group: ['candidatos.id'],
        order: [[sequelize.literal('resultado_total'), 'DESC']]
      });

      return res.status(200).json(resultado);

    } catch (error) {
      console.error("Erro ao mostrar votos:", error);
      return res.status(500).json({ message: "Erro ao mostrar votos" });
    }
  }

  async MostrarVotosProvincia(req, res){

    try{

          const {provincia} = req.body;

            let where = {};

            if (provincia) {

            where.provincia = provincia
          }



              const resultadosProvincia = await candidatos.findAll({
              attributes: [
                'id',
                'nome',
                'partido',
                [sequelize.col('voto.provincia'), 'provincia'],
                [sequelize.fn('COUNT', sequelize.col('voto.id')), 'total_votos_provincia']
              ],


              include: [
                {
                  model: votos,
                  as:'voto',
                  attributes: [],

                  
                       where
                }
              ],
              group: ['candidatos.id', 'candidatos.nome', 'candidatos.partido', 'voto.provincia'],
              order: [
                ['id', 'ASC'],
                [sequelize.literal('total_votos_provincia'), 'DESC']
              ]
            });

            // Agora agrupa-se manualmente os resultados
            const resultadosAgrupados = {};

            for (const linha of resultadosProvincia) {
              const candidatoId = linha.id;
              const provincia = linha.get('provincia');

              if (!provincia) continue; 

              if (!resultadosAgrupados[candidatoId]) {
                resultadosAgrupados[candidatoId] = {
                  nome: linha.nome,
                  partido: linha.partido,
                  total: 0,
                  provincias: []
                };
              }

              //console.log(linha.get('voto.provincia'))

              const votosProvincia = parseInt(linha.get('total_votos_provincia'), 10);

              resultadosAgrupados[candidatoId].total += votosProvincia;
              resultadosAgrupados[candidatoId].provincias.push({
                nome: provincia,
                votos: votosProvincia
              });
            }

          



            
            res.json({ resultados: resultadosAgrupados });


    }


    catch(error){

      console.error("Erro ao mostrar votos por candidatos e provincia:", error);

      return res.status(500).json({ message: "Erro ao mostrar votos por candidatos e provincia" });
      
    }
}

}

module.exports = new VotosController();
