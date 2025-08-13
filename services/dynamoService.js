const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'JobApplications';

/* ======================
   APPLICATION FUNCTIONS
   ====================== */

const putJobApplication = async (application) => {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            ...application,
            PKSort: `APP#${application.applicationId}`,
            entityType: 'Application',
        },
    };
    await ddbDocClient.send(new PutCommand(params));
};

const getJobApplicationsByUser = async (userEmail) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userEmail = :u AND begins_with(PKSort, :appPrefix)",
        ExpressionAttributeValues: { ":u": userEmail, ":appPrefix": "APP#" },
    };
    const data = await ddbDocClient.send(new QueryCommand(params));
    return data.Items || [];
};

const getJobApplicationById = async (userEmail, applicationId) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, PKSort: `APP#${applicationId}` },
    };
    const result = await ddbDocClient.send(new GetCommand(params));
    return result.Item;
};

const updateJobApplication = async (applicationId, userEmail, updateData) => {
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
            if (key === 'status') {
                updateExpressions.push(`#status = :status`);
                expressionAttributeNames['#status'] = 'status';
                expressionAttributeValues[':status'] = value;
            } else {
                updateExpressions.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = value;
            }
        }
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, PKSort: `APP#${applicationId}` },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
    };

    await ddbDocClient.send(new UpdateCommand(params));
};

const deleteJobApplication = async (applicationId, userEmail) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, PKSort: `APP#${applicationId}` },
    };
    await ddbDocClient.send(new DeleteCommand(params));
};

/* ======================
   SUPPORTING DOCUMENT FUNCTIONS
   ====================== */

const addSupportingDoc = async (doc) => {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            ...doc,
            PKSort: `DOC#${doc.applicationId}#${doc.docId}`,
            entityType: 'Document',
        },
    };
    await ddbDocClient.send(new PutCommand(params));
};

const getSupportingDocs = async (userEmail, applicationId) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userEmail = :u AND begins_with(PKSort, :docPrefix)",
        ExpressionAttributeValues: {
            ":u": userEmail,
            ":docPrefix": `DOC#${applicationId}#`,
        },
    };
    const data = await ddbDocClient.send(new QueryCommand(params));
    return data.Items || [];
};

const deleteSupportingDoc = async (userEmail, applicationId, docId) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, PKSort: `DOC#${applicationId}#${docId}` },
    };
    await ddbDocClient.send(new DeleteCommand(params));
};

/* ======================
   NOTE FUNCTIONS
   ====================== */

const addNote = async (note) => {
    const params = {
        TableName: TABLE_NAME,
        Item: {
            ...note,
            PKSort: `NOTE#${note.applicationId}#${note.noteId}`,
            entityType: 'Note',
        },
    };
    await ddbDocClient.send(new PutCommand(params));
};

const getNotes = async (userEmail, applicationId) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userEmail = :u AND begins_with(PKSort, :notePrefix)",
        ExpressionAttributeValues: {
            ":u": userEmail,
            ":notePrefix": `NOTE#${applicationId}#`,
        },
    };
    const data = await ddbDocClient.send(new QueryCommand(params));
    return data.Items || [];
};

const updateNote = async (userEmail, applicationId, noteId, updateData) => {
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
            updateExpressions.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        }
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, PKSort: `NOTE#${applicationId}#${noteId}` },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
    };

    await ddbDocClient.send(new UpdateCommand(params));
};

const deleteNote = async (userEmail, applicationId, noteId) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, PKSort: `NOTE#${applicationId}#${noteId}` },
    };
    await ddbDocClient.send(new DeleteCommand(params));
};

module.exports = {
    // Applications
    putJobApplication,
    getJobApplicationsByUser,
    getJobApplicationById,
    updateJobApplication,
    deleteJobApplication,

    // Supporting Docs
    addSupportingDoc,
    getSupportingDocs,
    deleteSupportingDoc,

    // Notes
    addNote,
    getNotes,
    updateNote,
    deleteNote,
};
