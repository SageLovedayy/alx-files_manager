import redisClient from '../utils/redis';

const authMiddleware = async (req, res, next) => {
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

    req.userId = userId;
    return next();
  } catch (error) {
    console.error('Error during authentication:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default authMiddleware;
