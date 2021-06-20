const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const express = require('express');
const multer = require('multer');
const { Messages, logger, modules, actions } = require('../helpers');
const db = require('../db');

const router = express.Router();
const uploadPath = path.join(__dirname, '..', '../public/uploads');
const uploadTmp = path.join(uploadPath, 'tmp');
const upload = multer({ dest: uploadTmp });

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Upload Examples' });
});

router.post('/upload', upload.any(), async (req, res) => {
  const file = req.files[0];
  const destination = file.destination;
  const path = file.path;

  try {
    const checksum = req.body.checksum;
    const chunkId = req.body.chunkId;
    const chunkName = `${chunkId}.${checksum}.chunk`;

    await fsPromises.rename(path, `${destination}/${chunkName}`);
    db.Chunk.create({ name: chunkName, chunkId, checksum, completed: true });

    const message = Messages.success(modules.UPLOAD, actions.UPLOAD, chunkName);
    logger.info(message);
    res.json({ code: 200, message });
  } catch (err) {
    const errMessage = Messages.fail(modules.UPLOAD, actions.UPLOAD, err.message);
    logger.error(errMessage);
    res.json({ code: 500, message: errMessage });
    res.status(500);
  }
});

router.post('/makefile', async (req, res) => {
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
        await db.Chunk.update(
          { completed: true, isDeleted: true },
          {
            where: {
              chunkId,
              checksum,
            },
          }
        );
        logger.info(Messages.success(modules.UPLOAD, actions.DELETE, `chunk ${file}`));
        if (chunkId === chunks - 1) {
          await db.Upload.create({ name: filename, checksum, chunks });

          const message = Messages.success(modules.UPLOAD, actions.UPLOAD, filename);
          logger.info(message);
          res.json({ code: 200, message });
        }
      } catch (err) {
        logger.info(Messages.info(modules.UPLOAD, actions.CREATE, path, `File ${path} not exists, `));
        await fsPromises.writeFile(path, content, { flag: 'w+' });
        await fsPromises.unlink(file);
        await db.Chunk.update(
          { completed: true, isDeleted: true },
          {
            where: {
              chunkId,
              checksum,
            },
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
});

module.exports = router;
