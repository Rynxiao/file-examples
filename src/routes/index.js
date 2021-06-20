const path = require('path');
const express = require('express');
const multer = require('multer');
const uploadService = require('../services/uploadService');

const router = express.Router();
const uploadPath = path.join(__dirname, '..', '../public/uploads');
const uploadTmp = path.join(uploadPath, 'tmp');
const upload = multer({ dest: uploadTmp });

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Upload Examples' });
});

router.get('/chunk/exist', uploadService.chunkExist);
router.get('/file/exist', uploadService.fileExist);
router.post('/upload', upload.any(), uploadService.uploadChunk);
router.post('/makefile', uploadService.makeFile);

module.exports = router;
