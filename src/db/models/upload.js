const sql = require('..');
const { logger, Messages, actions, modules } = require('../../helpers');

const Upload = function (upload) {
  this.name = upload.name;
  this.sum = upload.sum;
  this.isDeleted = upload.isDeleted;
};

Upload.create = (newUpload) =>
  new Promise((resolve, reject) => {
    sql.query('INSERT INTO uploads SET ?', newUpload, (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.CREATE, err));
        reject(err);
      }

      const result = { id: res.insertId, ...newUpload };
      logger.info(Messages.success(modules.DB, actions.CREATE, `upload, ${JSON.stringify(result)}`));
      resolve(result);
    });
  });

Upload.findById = (uploadId) =>
  new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM uploads WHERE id = ${uploadId}`, (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.GET, err));
        reject(err);
      }

      if (res.length) {
        logger.info(Messages.success(modules.DB, actions.GET, `upload, ${JSON.stringify(res[0])}`));
        resolve(res[0]);
      }

      // not found Upload with the id
      logger.info(Messages.info(modules.DB, actions.GET, `upload, not found`));
      resolve();
    });
  });

Upload.getAll = () =>
  new Promise((resolve, reject) => {
    sql.query('SELECT * FROM uploads', (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.GET, `upload all, ${err}`));
        reject(err);
      }

      logger.info(Messages.success(modules.DB, actions.GET, `uploads, ${JSON.stringify(res)}`));
      resolve(res);
    });
  });

Upload.updateById = (id, upload) =>
  new Promise((resolve, reject) => {
    sql.query('UPDATE uploads SET name = ?, sum = ? WHERE id = ?', [upload.name, upload.sum, id], (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.UPDATE, `upload, ${err}`));
        reject(err);
      }

      if (res.affectedRows === 0) {
        // not found Upload with the id
        logger.info(Messages.success(modules.DB, actions.UPDATE, `upload ${id}, not found`));
        resolve();
      }

      const response = { id: id, ...upload };
      logger.info(Messages.success(modules.DB, actions.UPDATE, `upload, ${JSON.stringify(response)}`));
      resolve(response);
    });
  });

Upload.remove = (id) =>
  new Promise((resolve, reject) => {
    sql.query('UPDATE uploads SET isDeleted = true WHERE id = ?', id, (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.DELETE, `upload ${id}, ${err}`));
        reject(err);
      }

      if (res.affectedRows === 0) {
        // not found Upload with the id
        logger.info(Messages.success(modules.DB, actions.DELETE, `upload ${id}, not found`));
        resolve();
      }

      logger.info(Messages.success(modules.DB, actions.DELETE, `upload, ${JSON.stringify(res)}`));
      resolve(res);
    });
  });

Upload.removeAll = () =>
  new Promise((resolve, reject) => {
    sql.query('DELETE FROM uploads', (err, res) => {
      if (err) {
        logger.error(Messages.fail(modules.DB, actions.DELETE, `uploads all, ${err}`));
        reject(err);
      }

      logger.info(Messages.success(modules.DB, actions.DELETE, `${res.affectedRows} uploads`));
      resolve(res);
    });
  });

module.exports = Upload;
