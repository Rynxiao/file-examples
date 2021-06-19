const { DataTypes } = require('sequelize');

const TABLE_NAME = 'Upload';
const attributes = {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sum: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
};

module.exports = (sequelize) => sequelize.define(TABLE_NAME, attributes);
