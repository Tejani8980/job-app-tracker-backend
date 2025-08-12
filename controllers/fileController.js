const s3Service = require('../services/s3Service');
const dynamoService = require('../services/dynamoService');

const { v4: uuidv4 } = require('uuid');

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload file to S3
    const data = await s3Service.uploadFile(req.file);



    // Prepare job application metadata
    const application = {
        applicationId: uuidv4(),
        jobTitle: req.body.jobTitle || 'Common Job',
        companyName: req.body.companyName || 'Common Company',
        resumeUrl: data.url,
        status: req.body.status || 'Applied',
        appliedDate: new Date().toISOString(),
    };

    // Save metadata to DynamoDB
    await dynamoService.putJobApplication(application);

    res.json({ message: 'File uploaded successfully', url: data.url });
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const key = req.params.filename;
    const stream = await s3Service.downloadFile(key);

    res.attachment(key);
    stream.pipe(res); // Pipe the stream to response
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  downloadFile,
};
