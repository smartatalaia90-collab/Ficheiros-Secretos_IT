const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bilhetes_identidade', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    numero_bi_enc: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    nome_completo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    genero: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nacionalidade: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "Angolana"
    },
    data_emissao: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    data_validade: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    local_emissao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'bilhetes_identidade',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "bilhetes_identidade_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
