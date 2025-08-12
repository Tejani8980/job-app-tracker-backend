const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const bcrypt = require("bcryptjs");
require('dotenv').config();

const REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.DYNAMODB_USER_TABLE_NAME;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const findUserByEmail = async (email) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { email },
  };

  try {
    const data = await ddbDocClient.send(new GetCommand(params));
    return data.Item || null;
  } catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  }
};

const createUser = async ({ email, password, firstName, lastName, phoneNumber }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    createdAt: new Date().toISOString(),
  };

  const params = {
    TableName: TABLE_NAME,
    Item: newUser,
    ConditionExpression: "attribute_not_exists(email)", // prevent overwrite if user exists
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    return newUser;
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      throw new Error("User already exists");
    }
    console.error("Error creating user:", err);
    throw err;
  }
};

const validateUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
};

module.exports = { findUserByEmail, createUser, validateUser };
