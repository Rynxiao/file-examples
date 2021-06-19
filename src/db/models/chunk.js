const { DataTypes } = require('sequelize');

const TABLE_NAME = 'Chunk';
const attributes = {
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
};

module.exports = (sequelize) => sequelize.define(TABLE_NAME, attributes);
