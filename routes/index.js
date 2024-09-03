import UsersController from '../controllers/UsersController';
import AppController from '../controllers/AppController';

const express = require('express');

const router = express.Router();

// Routes and associated controller methods
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);

module.exports = router;
