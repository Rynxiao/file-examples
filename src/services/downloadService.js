const path = require('path');
const fs = require('fs/promises');
const { Messages, logger, modules, actions } = require('../helpers');
const uploadRepository = require('../repositories/uploadRepository');
const chunkRepository = require('../repositories/chunkRepository');
const uploadsFolder = path.resolve(__dirname, '..', '../public/uploads');

const downloadService = {
  download: async (req, res) => {
    try {
      const files = await uploadRepository.findAll();
      const list = files ? files : [];
      const message = Messages.success(modules.DOWNLOAD, actions.GET, JSON.stringify(list));
      logger.info(message);
      res.render('download', { title: 'Download Examples', files: list });
    } catch (err) {
      const errMessage = Messages.fail(modules.DOWNLOAD, actions.GET, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
  deleteById: async (req, res) => {
    const id = req.params.id;
    try {
      // delete chunks
      const upload = await uploadRepository.findOne({ id });
      if (!upload.isCopy) {
        await chunkRepository.deleteBy({ checksum: upload.checksum });
      }

      // delete upload
      await uploadRepository.deleteById(id);

      // delete file
      await fs.unlink(path.resolve(uploadsFolder, upload.name));
      const message = Messages.success(modules.DOWNLOAD, actions.DELETE, `file ${id}`);
      logger.info(message);
      res.redirect('/downloads');
    } catch (err) {
      const errMessage = Messages.fail(modules.DOWNLOAD, actions.DELETE, err);
      logger.error(errMessage);
      res.json({ code: 500, message: errMessage });
      res.status(500);
    }
  },
};

module.exports = downloadService;
