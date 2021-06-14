const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const filesPath = path.join(__dirname, '..', '/public/assets');

router.get('/', async (req, res) => {
  const dir = await fs.promises.opendir(filesPath);
  const files = [];
  for await (const dirent of dir) {
    const filename = dirent.name;
    if (filename !== '.DS_Store') {
      files.push({ name: filename, isDirectory: dirent.isDirectory(), ext: filename.split('.').pop() });
    }
  }
  res.render('download', { title: 'Download Examples', files });
});

module.exports = router;
