const db = require('../db/index');
const { Messages, logger, modules, actions } = require('../helpers');

const uploadRepository = {
  create: async (newUpload) => {
    try {
      await db.Upload.create(newUpload);
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.CREATE, err));
      throw err;
    }
  },
  findOne: async (whereBy) => {
    try {
      return await db.Upload.findOne({ where: whereBy });
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.GET, err));
      throw err;
    }
  },
};

module.exports = uploadRepository;
