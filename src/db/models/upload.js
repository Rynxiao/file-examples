const sequelize = require('..');
const { DataTypes } = require('sequelize');

const Upload = sequelize.define('Upload', {
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
});

Upload.sync();
module.exports = Upload;
