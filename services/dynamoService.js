// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
// require('dotenv').config();

// const client = new DynamoDBClient({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const ddbDocClient = DynamoDBDocumentClient.from(client);

// const putJobApplication = async (application) => {
//   const params = {
//     TableName: process.env.DYNAMODB_TABLE_NAME || 'JobApplications',
//     Item: application,
//   };

//   await ddbDocClient.send(new PutCommand(params));
// };

// const getJobApplication = async (applicationId) => {
//   const params = {
//     TableName: process.env.DYNAMODB_TABLE_NAME || 'JobApplications',
//     Key: { applicationId },
//   };

//   const result = await ddbDocClient.send(new GetCommand(params));
//   return result.Item;
// };

// module.exports = {
//   putJobApplication,
//   getJobApplication,
// };


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

// Create application
const putJobApplication = async (application) => {
    const params = {
        TableName: TABLE_NAME,
        Item: application,
    };
    await ddbDocClient.send(new PutCommand(params));
};

// Get all applications for a specific user
const getJobApplicationsByUser = async (userEmail) => {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userEmail = :u",
        ExpressionAttributeValues: { ":u": userEmail },
    };
    const data = await ddbDocClient.send(new QueryCommand(params));
    return data.Items || [];
};

// Get single application by ID
const getJobApplicationById = async (userEmail, applicationId) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, applicationId },
    };
    const result = await ddbDocClient.send(new GetCommand(params));
    return result.Item;
};

// Update application
const updateJobApplication = async (applicationId, userEmail, updateData) => {
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
            // If key is a reserved word like 'status', map it to an alias
            if (key === 'status') {
                updateExpressions.push(`#status = :status`);
                expressionAttributeNames['#status'] = 'status';
                expressionAttributeValues[':status'] = value;
            } else {
                updateExpressions.push(`${key} = :${key}`);
                expressionAttributeValues[`:${key}`] = value;
            }
        }
    }

    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, applicationId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length ? expressionAttributeNames : undefined,
    };

    await ddbDocClient.send(new UpdateCommand(params));
};

// Delete application
const deleteJobApplication = async (applicationId, userEmail) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { userEmail, applicationId },
    };
    await ddbDocClient.send(new DeleteCommand(params));
};

module.exports = {
    putJobApplication,
    getJobApplicationsByUser,
    getJobApplicationById,
    updateJobApplication,
    deleteJobApplication
};
