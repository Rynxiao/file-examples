const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadPath = path.join(__dirname, '..', '/uploads');
const uploadTmp = path.join(uploadPath, 'tmp');
const upload = multer({ dest: uploadTmp });
const errorHandler = (err) => {
  if (err) {
    console.error(err);
  }
};

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});

router.post('/upload', upload.any(), (req, res) => {
  const file = req.files[0];
  const destination = file.destination;
  const path = file.path;

  try {
    const originalFilename = req.body.context;
    const chunkIndex = req.body.chunkIndex;
    const chunkName = `${chunkIndex}.${originalFilename}.chunk`;

    fs.renameSync(path, `${destination}/${chunkName}`);
    res.json({ code: 200 });
  } catch (e) {
    res.json({ code: 500, message: e.message });
    res.status(500);
  }
});

router.post('/makefile', (req, res) => {
  const chunks = req.body.chunks;
  const filename = req.body.filename;
  const path = `${uploadPath}/${filename}`;
  try {
    for (let i = 0; i < chunks; i++) {
      const file = `${uploadTmp}/${i}.${filename}.chunk`;
      const content = fs.readFileSync(file);
      try {
        fs.accessSync(path, fs.constants.F_OK);
        fs.appendFile(path, content, () => {
          fs.unlink(file, errorHandler);
          if (i === chunks - 1) {
            res.json({ code: 200, message: 'upload success!' });
          }
        });
      } catch (err) {
        fs.writeFile(path, content, { flag: 'w+' }, () => {
          fs.unlink(file, errorHandler);
        });
      }
    }
  } catch (err) {
    res.json({ code: 500, message: 'upload failed!' });
    res.status(500);
  }
});

module.exports = router;
