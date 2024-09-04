/* eslint-disable */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import isValidObjectId from '../utils/objectIdvalidation';
// import redisClient from '../utils/redisClient';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

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
}

export default FilesController;
