var express = require('express');
var router = express.Router();

/* GET tests page. */
router.get('/', function(req, res, next) {
  res.render('tests', { 
  	layout: false,
  	appId: process.env.appId
  });
});

module.exports = router;
