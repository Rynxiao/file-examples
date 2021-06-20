const path = require('path');
const fs = require('fs');
const { Messages, logger, modules, actions } = require('../helpers');

const filesPath = path.join(__dirname, '..', '/public/uploads');
const MAC_OS_EXT = '.DS_Store';
const ignoreFiles = [MAC_OS_EXT, 'tmp'];

const downloadService = {
  download: async (req, res) => {
    const dir = await fs.promises.opendir(filesPath);
    const files = [];
    for await (const dirent of dir) {
      const filename = dirent.name;
      if (!ignoreFiles.includes(filename)) {
        files.push({ name: filename, isDirectory: dirent.isDirectory(), ext: filename.split('.').pop() });
      }
    }
    logger.info(Messages.success(modules.DOWNLOAD, actions.GET, `files ${files.length}`));
    res.render('download', { title: 'Download Examples', files });
  },
};

module.exports = downloadService;