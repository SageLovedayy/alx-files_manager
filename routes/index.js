import UsersController from '../controllers/UsersController';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/authMiddleware';

const express = require('express');

const router = express.Router();

// Routes and associated controller methods
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);
router.get('/users/me', authMiddleware, UsersController.getMe);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', authMiddleware, AuthController.getDisconnect);
router.get('/users/me', authMiddleware, UsersController.getMe);
module.exports = router;
