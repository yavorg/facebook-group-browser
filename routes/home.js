var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('home', { 
  	statusMessage: process.env.statusMessage,
  	statusLink: process.env.statusLink,
  	appId: process.env.appId,
  	env: req.app.get('env')
  });
});

module.exports = router;
