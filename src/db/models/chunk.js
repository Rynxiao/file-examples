const { Sequelize, DataTypes } = require('sequelize');

const TABLE_NAME = 'Chunk';
const attributes = {
  id: {
    primaryKey: true,
    allowNull: false,
    type: Sequelize.UUID,
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
  chunkId: {
    type: DataTypes.INTEGER,
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

const options = {
  indexes: [{ unique: true, fields: ['checksum'] }],
};

module.exports = (sequelize) => sequelize.define(TABLE_NAME, attributes, options);
