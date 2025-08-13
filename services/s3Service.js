const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
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
const uploadFile = async (file, userIdOrKey) => {
  // If userIdOrKey is a key (string with slashes), use as-is; else build path for userId
  const key = userIdOrKey.includes('/') ? userIdOrKey : `${userIdOrKey}/${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  // Generate signed URL (valid for 1 hour)
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

// Delete file
const deleteFile = async (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  const command = new DeleteObjectCommand(params);
  await s3Client.send(command);
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
};
