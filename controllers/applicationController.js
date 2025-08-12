const s3Service = require('../services/s3Service');
const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

// Upload job application with resume file
const createApplication = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const userEmail = req.user.email;

    // Upload file to S3 under user folder
    const uploadResult = await s3Service.uploadFile(req.file, userEmail);

    console.log(uploadResult, "uploadResult");
    const application = {
      applicationId: uuidv4(),
      userEmail,
      jobTitle: req.body.jobTitle || 'Common Job',
      companyName: req.body.companyName || 'Common Company',
      resumeS3Key: uploadResult.key,
      resumeUrl: uploadResult.url,
      status: req.body.status || 'Applied',
      appliedDate: new Date().toISOString(),
    };

    await dynamoService.putJobApplication(application);

    res.status(201).json({ message: 'Application created successfully', application });
  } catch (error) {
    next(error);
  }
};

// Get all applications for logged-in user
const getUserApplications = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const applications = await dynamoService.getJobApplicationsByUser(userEmail);
    res.json({ applications });
  } catch (error) {
    next(error);
  }
};

// Get single application by ID (only if owned by user)
const getApplicationById = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const applicationId = req.params.id;

    const application = await dynamoService.getJobApplicationById(userEmail, applicationId);

    if (!application || application.userEmail !== userEmail) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application });
  } catch (error) {
    next(error);
  }
};

// Update application by ID (only if owned by user)
const updateApplication = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const applicationId = req.params.id;

    const existingApp = await dynamoService.getJobApplicationById(userEmail, applicationId);

    if (!existingApp || existingApp.userEmail !== userEmail) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updateData = {
      jobTitle: req.body.jobTitle,
      companyName: req.body.companyName,
      status: req.body.status,
      appliedDate: req.body.appliedDate,
    };

    await dynamoService.updateJobApplication(applicationId, userEmail, updateData);

    res.json({ message: 'Application updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete application and its file (only if owned by user)
const deleteApplication = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const applicationId = req.params.id;

    const application = await dynamoService.getJobApplicationById(userEmail, applicationId);

    if (!application || application.userEmail !== userEmail) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await s3Service.deleteFile(application.resumeS3Key);
    await dynamoService.deleteJobApplication(applicationId, userEmail);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Download resume file - only if owned by user
const downloadResume = async (req, res, next) => {
    try {
      const userEmail = req.user.email;
      const fileKey = req.query.fileKey; // get from query param
  
      if (!fileKey) {
        return res.status(400).json({ error: 'Missing fileKey query parameter' });
      }
  
      if (!fileKey.startsWith(`${userEmail}/`)) {
        return res.status(403).json({ error: 'Access denied' });
      }
  
      console.log("Downloading file:", fileKey);
      const fileStream = await s3Service.downloadFile(fileKey);
  
      res.attachment(fileKey.split('/').pop());
      fileStream.pipe(res);
  
    } catch (error) {
      next(error);
    }
  };

module.exports = {
  createApplication,
  getUserApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  downloadResume,
};
