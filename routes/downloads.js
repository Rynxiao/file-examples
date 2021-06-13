var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  res.render('download', { title: 'Download Examples' });
});

module.exports = router;
