const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const multer = require('multer');
const { Messages, logger, modules, actions } = require('../helpers');
const uploadRepository = require('../repositories/uploadRepository');
const chunkRepository = require('../repositories/chunkRepository');

const uploadPath = path.join(__dirname, '..', '../public/uploads');
const uploadTmp = path.join(uploadPath, 'tmp');

const storage = multer.diskStorage({
  destination: uploadTmp,
  filename: (req, file, cb) => {
    cb(null, file.fieldname);
  },
});

const multerUpload = multer({ storage });

const createFile = async (params) => {
  const { path, content, file, checksum, chunkId } = params;
  logger.info(Messages.info(modules.UPLOAD, actions.CREATE, path, `File ${path} not exists, `));
  await fsPromises.writeFile(path, content, { flag: 'w+' });
  await fsPromises.unlink(file);
  await chunkRepository.deleteBy({ chunkId, checksum });
  logger.info(Messages.success(modules.UPLOAD, actions.UPLOAD, `chunk ${file}`));
};

const appendFile = async (params) => {
  const { path, content, file, checksum, chunkId } = params;
  await fsPromises.appendFile(path, content);
  await fsPromises.unlink(file);
  await chunkRepository.deleteBy({ chunkId, checksum });
  logger.info(Messages.success(modules.UPLOAD, actions.UPLOAD, `chunk ${file}`));
};

const saveFileRecordToDB = async (params) => {
  const { filename, checksum, chunks, isCopy, res } = params;
  await uploadRepository.create({ name: filename, checksum, chunks, isCopy });

  const message = Messages.success(modules.UPLOAD, actions.UPLOAD, filename);
  logger.info(message);
  res.json({ code: 200, message });
};

const uploadService = {
  render: async (req, res) => {
    try {
      const files = await uploadRepository.findAll();
      const list = files ? files : [];
      const message = Messages.success(modules.UPLOAD, actions.GET, JSON.stringify(list));
      logger.info(message);
      res.render('index', { title: 'Upload Examples', files: list });
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.GET, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
  uploadChunk: async (req, res) => {
    const file = req.files[0];
    const chunkName = file.filename;

    try {
      const checksum = req.body.checksum;
      const chunkId = req.body.chunkId;

      await chunkRepository.create({ name: chunkName, chunkId, checksum });

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
      if (chunks === 1) {
        const chunkId = 0;
        const file = `${uploadTmp}/${chunkId}.${checksum}.chunk`;
        const content = await fsPromises.readFile(file);
        await createFile({ path, content, file, checksum, chunkId });
        await saveFileRecordToDB({ filename, checksum, chunks, isCopy: false, res });
      } else {
        for (let chunkId = 0; chunkId < chunks; chunkId++) {
          const file = `${uploadTmp}/${chunkId}.${checksum}.chunk`;
          const content = await fsPromises.readFile(file);
          logger.info(Messages.success(modules.UPLOAD, actions.GET, file));
          try {
            await fsPromises.access(path, fs.constants.F_OK);
            await appendFile({ path, content, file, checksum, chunkId });
            if (chunkId === chunks - 1) {
              await saveFileRecordToDB({ filename, checksum, chunks, isCopy: false, res });
            }
          } catch (err) {
            await createFile({ path, content, file, checksum, chunkId });
          }
        }
      }
    } catch (err) {
      try {
        await fsPromises.access(path);
        await fsPromises.unlink(path);
      } catch (err) {
        const message = Messages.fail(modules.UPLOAD, actions.UPLOAD, err.message);
        logger.info(message);
        res.json({ code: 500, message });
        res.status(500);
      }
    }
  },
  copyFile: async (req, res) => {
    const sourceFilename = req.query.sourceFilename;
    const targetFilename = req.query.targetFilename;
    const checksum = req.query.checksum;
    const sourceFile = `${uploadPath}/${sourceFilename}`;
    const targetFile = `${uploadPath}/${targetFilename}`;

    try {
      await fsPromises.copyFile(sourceFile, targetFile);
      await saveFileRecordToDB({ filename: targetFilename, checksum, chunks: 0, isCopy: true, res });
    } catch (err) {
      const message = Messages.fail(modules.UPLOAD, actions.UPLOAD, err.message);
      logger.info(message);
      res.json({ code: 500, message });
      res.status(500);
    }
  },
  chunksExist: async (req, res) => {
    const checksum = req.query.checksum;
    try {
      const chunks = await chunkRepository.findAllBy({ checksum });
      const exists = chunks.reduce((cur, chunk) => {
        cur[chunk.chunkId] = true;
        return cur;
      }, {});
      const message = Messages.success(modules.UPLOAD, actions.CHECK, `chunk ${JSON.stringify(exists)} exists`);
      logger.info(message);
      res.json({ code: 200, message: message, data: exists });
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.CHECK, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
  deleteChunk: async (req, res) => {
    const checksum = req.query.checksum;
    const chunkId = req.query.chunkId;
    const file = `${uploadTmp}/${chunkId}.${checksum}.chunk`;

    try {
      await fsPromises.unlink(file);
      const message = Messages.success(modules.UPLOAD, actions.DELETE, file);
      logger.info(message);
      res.json({ code: 200, message, data: null });
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.DELETE, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
  fileExist: async (req, res) => {
    const checksum = req.query.checksum;
    try {
      const files = await uploadRepository.findAllBy({ checksum });
      if (files.length !== 0) {
        const message = Messages.success(modules.UPLOAD, actions.CHECK, `file ${checksum} exists`);
        logger.info(message);
        res.json({ code: 200, message: message, data: { exists: true, files } });
      } else {
        const message = Messages.info(modules.UPLOAD, actions.CHECK, `file not exists`);
        logger.info(message);
        res.json({ code: 200, message: message, data: null });
      }
    } catch (err) {
      const errMessage = Messages.fail(modules.UPLOAD, actions.CHECK, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
};

module.exports = {
  multerUpload,
  uploadService,
};
