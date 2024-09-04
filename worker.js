/*eslint-disable*/
const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { promisify } = require('util');
const dbClient = require('./utils/db');

const writeFileAsync = promisify(fs.writeFile);
const accessAsync = promisify(fs.access);
const statAsync = promisify(fs.stat);

const fileQueue = new Bull('fileQueue');

async function generateThumbnails(file) {
  const sizes = [500, 250, 100];
  for (const size of sizes) {
    try {
      // Generate thumbnail
      const thumbnail = await imageThumbnail(file.localPath, {
        width: size,
      });

      // Define thumbnail path
      const thumbnailPath = `${file.localPath}_${size}.png`;

      // Write thumbnail to file
      await writeFileAsync(thumbnailPath, thumbnail);

      // Verify file existence
      await accessAsync(thumbnailPath, fs.constants.F_OK);
      console.log(`Thumbnail file exists: ${thumbnailPath}`);

      // Verify file size
      const stats = await statAsync(thumbnailPath);
      if (stats.size > 0) {
        console.log(`Thumbnail file size is valid: ${thumbnailPath}`);
      } else {
        console.error(
          `Thumbnail file size is zero: ${thumbnailPath}`,
        );
      }

      // Verify file type
      // Uncomment if fileType module is available
      // const type = await fileType.fromFile(thumbnailPath);
      // if (type && type.mime.startsWith('image/')) {
      //   console.log(`Thumbnail file type is valid: ${type.mime}`);
      // } else {
      //   console.error(`Invalid file type for thumbnail: ${thumbnailPath}`);
      // }
    } catch (error) {
      console.error(
        `Error processing thumbnail size ${size}:`,
        error,
      );
    }
  }
}

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  try {
    const db = dbClient.client.db(dbClient.databaseName);
    const filesCollection = db.collection('files');
    const file = await filesCollection.findOne({
      _id: new ObjectId(fileId),
      userId: new ObjectId(userId),
    });

    if (!file) {
      throw new Error('File not found');
    }

    if (file.type !== 'image') {
      throw new Error('File is not an image');
    }

    // Generate thumbnails
    await generateThumbnails(file);

    console.log('Thumbnails generated successfully');
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file');
  }
});
