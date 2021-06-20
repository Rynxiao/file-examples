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
      logger.error(Messages.fail(modules.DB, actions.UPLOAD, err));
      throw err;
    }
  },
};

module.exports = chunkRepository;
