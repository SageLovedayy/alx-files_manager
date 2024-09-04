import UsersController from '../controllers/UsersController';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middleware/authMiddleware';
import FilesController from '../controllers/FilesController';

const express = require('express');

const router = express.Router();

// Routes and associated controller methods
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.post('/users', UsersController.postNew);
router.get('/users/me', authMiddleware, UsersController.getMe);

router.get('/connect', AuthController.getConnect);
router.get(
  '/disconnect',
  authMiddleware,
  AuthController.getDisconnect,
);
router.get('/users/me', authMiddleware, UsersController.getMe);

router.post('/files', authMiddleware, FilesController.postUpload);

router.get('/files/:id', authMiddleware, FilesController.getShow);
router.get('/files', authMiddleware, FilesController.getIndex);

router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

router.get('/files/:id/data', FilesController.getFile);
module.exports = router;
