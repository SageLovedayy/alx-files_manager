import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check for existing email
      const db = dbClient.client.db(dbClient.databaseName);
      const usersCollection = db.collection('users');
      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Password hash using SHA1
      const hashedPassword = crypto
        .createHash('sha1')
        .update(password)
        .digest('hex');

      // Create new user
      const result = await usersCollection.insertOne({
        email,
        password: hashedPassword,
      });

      // Return the new user with email and id
      const newUser = result.ops[0];
      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
