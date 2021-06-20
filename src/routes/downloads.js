const path = require('path');
const express = require('express');
const downloadService = require('../services/downloadService');

const router = express.Router();

router.get('/', downloadService.download);
router.get('/delete/:id', downloadService.deleteById);

module.exports = router;
