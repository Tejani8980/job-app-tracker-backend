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

//  ---------- Job Applications ---------- 
router.post('/', upload.single('file'), applicationController.createApplication);
router.get('/', applicationController.getUserApplications);
router.get('/download', applicationController.downloadResume);
router.get('/:id', applicationController.getApplicationById);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);

// ---------- SUPPORTING DOCUMENTS ----------
router.post('/:applicationId/documents', upload.array('files'), applicationController.addSupportingDocuments);
router.get('/:applicationId/documents', applicationController.getSupportingDocuments);
router.delete('/:applicationId/documents/:docId', applicationController.deleteSupportingDocument);

// ---------- NOTES ----------
router.post('/:applicationId/notes', applicationController.addNote);
router.get('/:applicationId/notes', applicationController.getNotes);
router.put('/:applicationId/notes/:noteId', applicationController.updateNote);
router.delete('/:applicationId/notes/:noteId', applicationController.deleteNote);

module.exports = router;
