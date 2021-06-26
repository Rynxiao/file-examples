const express = require('express');
const { uploadService, multerUpload } = require('../services/uploadService');

const router = express.Router();

/* GET home page. */
router.get('/', uploadService.render);
router.get('/chunks/exist', uploadService.chunksExist);
router.delete('/chunk/delete', uploadService.deleteChunk);
router.get('/file/exist', uploadService.fileExist);
router.post('/upload', multerUpload.any(), uploadService.uploadChunk);
router.post('/makefile', uploadService.makeFile);
router.get('/copyfile', uploadService.copyFile);

module.exports = router;
