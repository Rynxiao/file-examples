const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');
const express = require('express');
const router = express.Router();
const multer = require('multer');
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
      try {
        await fsPromises.access(path, fs.constants.F_OK);
        await fsPromises.appendFile(path, content);
        await fsPromises.unlink(file);
        if (i === chunks - 1) {
          res.json({ code: 200, message: `file ${filename} upload success!` });
        }
      } catch (err) {
        await fsPromises.writeFile(path, content, { flag: 'w+' });
        await fsPromises.unlink(file);
      }
    }
  } catch (err) {
    res.status(500);
    res.json({ code: 500, message: `file ${filename} upload failed!` });
  }
});

module.exports = router;
