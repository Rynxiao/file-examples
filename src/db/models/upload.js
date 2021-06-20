const { Sequelize, DataTypes } = require('sequelize');

const TABLE_NAME = 'Upload';
const attributes = {
  id: {
    primaryKey: true,
    allowNull: false,
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  checksum: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  chunks: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
};

const options = {
  indexes: [{ fields: ['checksum'] }],
};

module.exports = (sequelize) => sequelize.define(TABLE_NAME, attributes, options);
