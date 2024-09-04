/* eslint-disable*/
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import isValidObjectId from '../utils/objectIdvalidation';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const mime = require('mime-types');

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic, data } = req.body;

    const { userId } = req;

    if (!name) {
      return res.status(400).json({
        error: 'Missing name',
      });
    }

    const validTypes = ['folder', 'file', 'image'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Missing type',
      });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({
        error: 'Missing data',
      });
    }

    if (parentId) {
      if (!isValidObjectId(parentId)) {
        return res.status(400).json({
          error: 'Invalid parentId format',
        });
      }

      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');
      const parentFile = await filesCollection.findOne({
        _id: new ObjectId(parentId),
      });

      if (!parentFile) {
        return res.status(400).json({
          error: 'Parent not found',
        });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({
          error: 'Parent is not a folder',
        });
      }
    }

    // Prepare file storage
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, {
        recursive: true,
      });
    }

    let localPath = '';
    if (type === 'file' || type === 'image') {
      const fileName = crypto.randomUUID();
      localPath = path.join(FOLDER_PATH, fileName);
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer);
    }

    try {
      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');
      const newFile = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
        localPath:
          type === 'file' || type === 'image' ? localPath : undefined,
      };

      const result = await filesCollection.insertOne(newFile);
      const savedFile = result.insertedId; // Changed from result.ops[0] to result.insertedId

      return res.status(201).json({
        id: savedFile,
        ...newFile,
      });
    } catch (error) {
      console.error('Error during file upload:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
      });
    }
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      if (!ObjectId.isValid(fileId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
        userId,
      });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(file);
    } catch (error) {
      console.error('Error retrieving file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /files - Retrieve files by parentId with pagination
  static async getIndex(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parentId = req.query.parentId || 0;
      const page = parseInt(req.query.page, 10) || 0;
      const limit = 20;
      const skip = page * limit;

      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');

      const query = {
        userId,
        parentId,
      };

      console.log('Query:', query);

      const files = await filesCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      console.log('Files found:', files);

      return res.status(200).json(files);
    } catch (error) {
      console.error('Error retrieving files:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      if (!ObjectId.isValid(fileId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
        userId,
      });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const updatedFile = await filesCollection.findOneAndUpdate(
        { _id: new ObjectId(fileId), userId },
        { $set: { isPublic: true } },
        { returnDocument: 'after' },
      );

      return res.status(200).json(updatedFile.value);
    } catch (error) {
      console.error('Error in putPublish:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const fileId = req.params.id;
      if (!ObjectId.isValid(fileId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
        userId,
      });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const updatedFile = await filesCollection.findOneAndUpdate(
        { _id: new ObjectId(fileId), userId },
        { $set: { isPublic: false } },
        { returnDocument: 'after' },
      );

      return res.status(200).json(updatedFile.value);
    } catch (error) {
      console.error('Error in putUnpublish:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    if (!ObjectId.isValid(fileId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    try {
      const db = dbClient.client.db(dbClient.databaseName);
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
      });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (
        !file.isPublic &&
        (!userId || file.userId.toString() !== userId)
      ) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.type === 'folder') {
        return res
          .status(400)
          .json({ error: "A folder doesn't have content" });
      }

      if (!file.localPath || !fs.existsSync(file.localPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      const mimeType =
        mime.lookup(file.name) || 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);

      return res.status(200).sendFile(file.localPath);
    } catch (error) {
      console.error('Error in getFile:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
