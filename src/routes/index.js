const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const express = require('express');
const multer = require('multer');
const { Messages, logger, modules, actions } = require('../src/helpers');

const router = express.Router();
const uploadPath = path.join(__dirname, '..', '/public/uploads');
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
    const fileHash = req.body.fileHash;
    const chunkIndex = req.body.chunkIndex;
    const chunkName = `${chunkIndex}.${fileHash}.chunk`;

    await fsPromises.rename(path, `${destination}/${chunkName}`);
    logger.info(Messages.success(modules.UPLOAD, actions.UPLOAD, chunkName));
    res.json({ code: 200 });
  } catch (e) {
    res.json({ code: 500, message: e.message });
    res.status(500);
  }
});

router.post('/makefile', async (req, res) => {
  const chunks = req.body.chunks;
  const filename = req.body.filename;
  const fileHash = req.body.fileHash;
  const path = `${uploadPath}/${filename}`;
  try {
    for (let i = 0; i < chunks; i++) {
      const file = `${uploadTmp}/${i}.${fileHash}.chunk`;
      const content = await fsPromises.readFile(file);
      logger.info(Messages.success(modules.UPLOAD, actions.GET, file));
      try {
        await fsPromises.access(path, fs.constants.F_OK);
        await fsPromises.appendFile(path, content);
        await fsPromises.unlink(file);
        logger.info(Messages.success(modules.UPLOAD, actions.DELETE, `chunk ${file}`));
        if (i === chunks - 1) {
          logger.info(Messages.success(modules.UPLOAD, actions.UPLOAD, filename));
          res.json({ code: 200, message: `file ${filename} upload success!` });
        }
      } catch (err) {
        logger.info(Messages.info(modules.UPLOAD, actions.CREATE, path, `File ${path} not exists, `));
        await fsPromises.writeFile(path, content, { flag: 'w+' });
        await fsPromises.unlink(file);
      }
    }
  } catch (err) {
    res.status(500);
    logger.info(Messages.fail(modules.UPLOAD, actions.UPLOAD, filename));
    res.json({ code: 500, message: `file ${filename} upload failed!` });
  }
});

module.exports = router;
