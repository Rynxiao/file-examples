const sequelize = require('..');
const { DataTypes } = require('sequelize');

const Chunk = sequelize.define('Chunk', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sum: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Chunk.sync();
module.exports = Chunk;
