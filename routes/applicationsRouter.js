const express = require('express');
const multer = require('multer');
const { uploadFile, downloadFile } = require('../controllers/fileController');
const applicationController = require('../controllers/applicationController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadFile);
router.get('/download/:filename', downloadFile);

// Protect all routes with JWT middleware
router.use(authenticateToken);

// Create a new job application with file upload
router.post('/', upload.single('file'), applicationController.createApplication);

// Get all job applications for logged-in user
router.get('/', applicationController.getUserApplications);

// Download resume file
router.get('/download', applicationController.downloadResume);

// Get a specific application by ID (ensure user owns it)
router.get('/:id', applicationController.getApplicationById);

// Update an application by ID
router.put('/:id', applicationController.updateApplication);

// Delete an application by ID
router.delete('/:id', applicationController.deleteApplication);



module.exports = router;
