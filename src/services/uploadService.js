const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { Messages, logger, modules, actions } = require('../helpers');
const uploadRepository = require('../repositories/uploadRepository');
const chunkRepository = require('../repositories/chunkRepository');

const uploadPath = path.join(__dirname, '..', '../public/uploads');
const uploadTmp = path.join(uploadPath, 'tmp');

const uploadService = {
  uploadChunk: async (req, res) => {
    const file = req.files[0];
    const destination = file.destination;
    const path = file.path;

    try {
      const checksum = req.body.checksum;
      const chunkId = req.body.chunkId;
      const chunkName = `${chunkId}.${checksum}.chunk`;

      await fsPromises.rename(path, `${destination}/${chunkName}`);
      await chunkRepository.create({ name: chunkName, chunkId, checksum, completed: true });

      const message = Messages.success(modules.UPLOAD, actions.UPLOAD, chunkName);
      logger.info(message);
      res.json({ code: 200, message });
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.UPLOAD, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
  makeFile: async (req, res) => {
    const chunks = req.body.chunks;
    const filename = req.body.filename;
    const checksum = req.body.checksum;
    const path = `${uploadPath}/${filename}`;

    try {
      for (let chunkId = 0; chunkId < chunks; chunkId++) {
        const file = `${uploadTmp}/${chunkId}.${checksum}.chunk`;
        const content = await fsPromises.readFile(file);
        logger.info(Messages.success(modules.UPLOAD, actions.GET, file));
        try {
          await fsPromises.access(path, fs.constants.F_OK);
          await fsPromises.appendFile(path, content);
          await fsPromises.unlink(file);
          await chunkRepository.update(
            { completed: true, isDeleted: true },
            {
              chunkId,
              checksum,
            }
          );
          logger.info(Messages.success(modules.UPLOAD, actions.DELETE, `chunk ${file}`));
          if (chunkId === chunks - 1) {
            await uploadRepository.create({ name: filename, checksum, chunks });

            const message = Messages.success(modules.UPLOAD, actions.UPLOAD, filename);
            logger.info(message);
            res.json({ code: 200, message });
          }
        } catch (err) {
          logger.info(Messages.info(modules.UPLOAD, actions.CREATE, path, `File ${path} not exists, `));
          await fsPromises.writeFile(path, content, { flag: 'w+' });
          await fsPromises.unlink(file);
          await chunkRepository.update(
            { completed: true, isDeleted: true },
            {
              chunkId,
              checksum,
            }
          );
        }
      }
    } catch (err) {
      await fsPromises.unlink(path);

      const message = Messages.fail(modules.UPLOAD, actions.UPLOAD, err.message);
      logger.info(message);
      res.json({ code: 500, message });
      res.status(500);
    }
  },
  chunkExist: async (req, res) => {
    const checksum = req.query.checksum;
    const chunkId = req.query.chunkId;
    try {
      const chunk = await chunkRepository.findOne({ checksum, chunkId });
      if (chunk) {
        const message = Messages.success(modules.UPLOAD, actions.CHECK, `chunk ${chunk.id} exists`);
        logger.info(message);
        res.json({ code: 200, message: message, data: { id: chunk.id } });
      }
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.CHECK, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
  fileExist: async (req, res) => {
    const checksum = req.query.checksum;
    try {
      const file = await uploadRepository.findOne({ checksum });
      if (file) {
        const message = Messages.success(modules.UPLOAD, actions.CHECK, `file ${file.id} exists`);
        logger.info(message);
        res.json({ code: 200, message: message, data: { id: file.id } });
      }
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.CHECK, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
};

module.exports = uploadService;
