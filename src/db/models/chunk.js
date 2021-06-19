const sql = require('..');
const { logger, Messages, actions, modules } = require('../../helpers');

const Chunk = function (chunk) {
  this.name = chunk.name;
  this.sum = chunk.sum;
  this.compeleted = chunk.compeleted;
  this.isDeleted = chunk.isDeleted;
};

Chunk.create = (newChunk) =>
  new Promise((resolve, reject) => {
    sql.query('INSERT INTO chunks SET ?', newChunk, (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.CREATE, err));
        reject(err);
      }

      const result = { id: res.insertId, ...newChunk };
      logger.info(Messages.success(modules.DB, actions.CREATE, `chunk, ${JSON.stringify(result)}`));
      resolve(result);
    });
  });

Chunk.findById = (chunkId) =>
  new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM chunks WHERE id = ${chunkId}`, (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.GET, err));
        reject(err);
      }

      if (res.length) {
        logger.info(Messages.success(modules.DB, actions.GET, `chunk, ${JSON.stringify(res[0])}`));
        resolve(res[0]);
      }

      // not found Chunk with the id
      logger.info(Messages.info(modules.DB, actions.GET, `chunk, not found`));
      resolve();
    });
  });

Chunk.getAll = () =>
  new Promise((resolve, reject) => {
    sql.query('SELECT * FROM chunks', (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.GET, `chunk all, ${err}`));
        reject(err);
      }

      logger.info(Messages.success(modules.DB, actions.GET, `chunks, ${JSON.stringify(res)}`));
      resolve(res);
    });
  });

Chunk.updateById = (id, chunk) =>
  new Promise((resolve, reject) => {
    sql.query(
      'UPDATE chunks SET name = ?, sum = ?, compeleted = ? WHERE id = ?',
      [chunk.name, chunk.sum, chunk.compeleted, id],
      (err, res) => {
        if (err) {
          logger.error(Messages.fail(modules.DB, actions.UPDATE, `chunk, ${err}`));
          reject(err);
        }

        if (res.affectedRows === 0) {
          // not found Chunk with the id
          logger.info(Messages.success(modules.DB, actions.UPDATE, `chunk ${id}, not found`));
          resolve();
        }

        const response = { id: id, ...chunk };
        logger.info(Messages.success(modules.DB, actions.UPDATE, `chunk, ${JSON.stringify(response)}`));
        resolve(response);
      }
    );
  });

Chunk.remove = (id) =>
  new Promise((resolve, reject) => {
    sql.query('UPDATE chunks SET isDeleted = true WHERE id = ?', id, (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.DELETE, `chunk ${id}, ${err}`));
        reject(err);
      }

      if (res.affectedRows === 0) {
        // not found Chunk with the id
        logger.info(Messages.success(modules.DB, actions.DELETE, `chunk ${id}, not found`));
        resolve();
      }

      logger.info(Messages.success(modules.DB, actions.DELETE, `chunk, ${JSON.stringify(res)}`));
      resolve(res);
    });
  });

Chunk.removeAll = () =>
  new Promise((resolve, reject) => {
    sql.query('UPDATE chunks SET isDeleted = true', (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.DELETE, `chunks all, ${err}`));
        reject(err);
      }

      logger.info(Messages.success(modules.DB, actions.DELETE, `${res.affectedRows} chunks`));
      resolve(res);
    });
  });

module.exports = Chunk;
