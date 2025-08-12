const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload file
const uploadFile = async (file, userId) => {
  const key = `${userId}/${Date.now()}-${file.originalname}`; // user-specific path

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  // Optionally generate signed URL
  const url = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key
  }), { expiresIn: 3600 });

  return { key, url };
};

// Download file
const downloadFile = async (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const data = await s3Client.send(command);
  return data.Body; // This is a stream
};

module.exports = {
  uploadFile,
  downloadFile,
};
