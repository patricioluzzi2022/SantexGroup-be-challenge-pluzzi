const express = require('express');
const router = express.Router();
const testController = require('./controllers/testController');

router.use('/test', testController);

module.exports = router;