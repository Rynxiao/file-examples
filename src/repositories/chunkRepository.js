const db = require('../db/index');
const { Messages, logger, modules, actions } = require('../helpers');

const chunkRepository = {
  create: async (newChunk) => {
    try {
      await db.Chunk.create(newChunk);
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.CREATE, err));
      throw err;
    }
  },
  update: async (updateChunk, whereBy) => {
    try {
      await db.Chunk.update(updateChunk, { where: whereBy });
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.UPDATE, err));
      throw err;
    }
  },
  findOne: async (whereBy) => {
    try {
      return await db.Chunk.findOne({ where: whereBy });
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.GET, err));
      throw err;
    }
  },
  findAllBy: async (whereBy) => {
    try {
      return await db.Chunk.findAll({ where: whereBy });
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.GET, err));
      throw err;
    }
  },
  deleteBy: async (deleteBy) => {
    try {
      return await db.Chunk.destroy({ where: deleteBy });
    } catch (err) {
      logger.error(Messages.fail(modules.DB, actions.DELETE, err));
      throw err;
    }
  },
};

module.exports = chunkRepository;
