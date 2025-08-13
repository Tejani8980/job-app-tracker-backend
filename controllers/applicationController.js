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

        const fileStream = await s3Service.downloadFile(fileKey);

        res.attachment(fileKey.split('/').pop());
        fileStream.pipe(res);

    } catch (error) {
        next(error);
    }
};

// --- Supporting Documents ---

// Add supporting documents to an existing application
const addSupportingDocuments = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            const s3Key = `${userEmail}/${applicationId}/supporting_docs/${Date.now()}-${file.originalname}`;
            const uploadResult = await s3Service.uploadFile(file, s3Key);

            const doc = {
                id: uuidv4(),
                s3Key,
                url: uploadResult.url,
                fileName: file.originalname,
                uploadedAt: new Date().toISOString(),
            };

            uploadedFiles.push(doc);
        }

        const updatedSupportingDocs = (application.supportingDocuments || []).concat(uploadedFiles);

        await dynamoService.updateJobApplication(applicationId, userEmail, {
            supportingDocuments: updatedSupportingDocs,
        });

        res.status(201).json({ message: 'Supporting documents added', documents: uploadedFiles });
    } catch (error) {
        next(error);
    }
};

// Get supporting documents of an application
const getSupportingDocuments = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ supportingDocuments: application.supportingDocuments || [] });
    } catch (error) {
        next(error);
    }
};

// Delete a supporting document by ID
const deleteSupportingDocument = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;
        const docId = req.params.docId;

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const docs = application.supportingDocuments || [];
        const docToDelete = docs.find(doc => doc.id === docId);
        if (!docToDelete) {
            return res.status(404).json({ error: 'Document not found' });
        }

        await s3Service.deleteFile(docToDelete.s3Key);

        const updatedDocs = docs.filter(doc => doc.id !== docId);
        await dynamoService.updateJobApplication(applicationId, userEmail, {
            supportingDocuments: updatedDocs,
        });

        res.json({ message: 'Supporting document deleted' });
    } catch (error) {
        next(error);
    }
};

// --- Notes ---

// Add a note to an application
const addNote = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;
        const { title, description, type } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const newNote = {
            id: uuidv4(),
            title,
            description,
            type: type || 'other',
            createdAt: new Date().toISOString(),
        };

        const updatedNotes = (application.notes || []).concat(newNote);

        await dynamoService.updateJobApplication(applicationId, userEmail, {
            notes: updatedNotes,
        });

        res.status(201).json({ message: 'Note added', note: newNote });
    } catch (error) {
        next(error);
    }
};

// Get notes for an application
const getNotes = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ notes: application.notes || [] });
    } catch (error) {
        next(error);
    }
};

// Update a note by ID
const updateNote = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;
        const noteId = req.params.noteId;
        const { title, description, type } = req.body;

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        let notes = application.notes || [];
        const noteIndex = notes.findIndex(note => note.id === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (title !== undefined) notes[noteIndex].title = title;
        if (description !== undefined) notes[noteIndex].description = description;
        if (type !== undefined) notes[noteIndex].type = type;

        await dynamoService.updateJobApplication(applicationId, userEmail, { notes });

        res.json({ message: 'Note updated', note: notes[noteIndex] });
    } catch (error) {
        next(error);
    }
};

// Delete a note by ID
const deleteNote = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        const applicationId = req.params.applicationId;
        const noteId = req.params.noteId;

        const application = await dynamoService.getJobApplicationById(userEmail, applicationId);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const notes = application.notes || [];
        const updatedNotes = notes.filter(note => note.id !== noteId);

        await dynamoService.updateJobApplication(applicationId, userEmail, {
            notes: updatedNotes,
        });

        res.json({ message: 'Note deleted' });
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

    addSupportingDocuments,
    getSupportingDocuments,
    deleteSupportingDocument,

    addNote,
    getNotes,
    updateNote,
    deleteNote,
};
