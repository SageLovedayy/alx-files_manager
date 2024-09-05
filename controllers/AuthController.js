import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];

    const credentials = Buffer.from(
      base64Credentials,
      'base64',
    ).toString('ascii');

    //    if (
    //      !credentials ||
    //      !/^[A-Za-z0-9+/=]+$/.test(credentials)
    //    ) {
    //      return res.status(401).json({ error: 'Unauthorized' });
    //    }

    console.log('credentials', credentials);

    const [email, password] = credentials.split(':');

    try {
      const db = dbClient.client.db(dbClient.databaseName);
      const usersCollection = db.collection('users');

      const hashedPassword = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex');

      // console.log('Finding user with:', { email, hashedPassword });

      const user = await usersCollection.findOne({
        email,
        password: hashedPassword,
      });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();

      // Store the token in Redis with a 24-hour expiration
      const redisKey = `auth_${token}`;
      await redisClient.set(
        redisKey,
        user._id.toString(),
        24 * 60 * 60,
      );

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error during getConnect:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
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

      await redisClient.del(redisKey);
      return res.status(204).send();
    } catch (error) {
      console.error('Error during getDisconnect:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
