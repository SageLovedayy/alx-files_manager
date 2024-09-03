// controllers/AppController.js

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    try {
      // Redis connection check
      const redisAlive = redisClient.isAlive();
      const dbAlive = dbClient.isAlive();

      res.status(200).json({ redis: redisAlive, db: dbAlive });
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        redis: redisClient.isAlive(),
        db: dbClient.isAlive(),
      });
    }
  }

  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AppController;
