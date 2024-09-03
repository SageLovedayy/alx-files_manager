import { MongoClient } from 'mongodb';

class DBClient {
  constructor () {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}`;

    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    this.databaseName = database;
    this.connected = false;
    this.client
      .connect()
      .then(() => {
        this.connected = true;
        // console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
      });
  }

  isAlive () {
    return (
      this.connected &&
      this.client.topology &&
      this.client.topology.isConnected()
    );
  }

  async nbUsers () {
    try {
      const db = this.client.db(this.databaseName);
      const usersCollection = db.collection('users');
      return await usersCollection.countDocuments();
    } catch (error) {
      console.error('Error fetching user count:', error);
      throw error; // re-throwing the error so it can be caught upstream
    }
  }

  async nbFiles () {
    try {
      const db = this.client.db(this.databaseName);
      const filesCollection = db.collection('files');
      return await filesCollection.countDocuments();
    } catch (error) {
      console.error('Error fetching file count:', error);
      throw error; // re-throwing the error so it can be caught upstream
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
