# Job Application Tracker - Backend API

## Project Overview

This is the Node.js and Express.js backend API for the Job Application Tracker app. It provides secure user authentication, CRUD operations for job applications, and integrates with AWS services such as DynamoDB for data storage and S3 for resume file uploads. The API supports the React frontend to deliver a full-featured job tracking solution.

---

## Features

- User authentication using AWS Cognito or JWT
- CRUD endpoints for managing job applications
- Resume and cover letter file upload handling with Amazon S3
- Interview scheduling and application status updates
- Secure RESTful API design with proper error handling

---

## Technology Stack

- Node.js with Express.js
- AWS SDK for JavaScript to interact with DynamoDB, S3, and Cognito
- dotenv for environment variable management
- CORS for cross-origin resource sharing
- Jest (or other) for testing (optional)

---

## Getting Started

### Prerequisites

- Node.js (version 16 or later)
- npm (comes with Node.js)
- AWS account with configured credentials and permissions for DynamoDB, S3, Cognito

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/job-app-tracker-backend.git
```

2. Change into the project directory:

```bash
cd job-app-tracker-backend
```

3. Install dependencies:

```bash
npm install
```

4. Create a .env file in the root folder and add your AWS credentials and config:


`AWS_ACCESS_KEY_ID=your_access_key`
`AWS_SECRET_ACCESS_KEY=your_secret_key`
`AWS_REGION=your_aws_region`
`PORT=5000`

Keep your .env file secure and do not commit it to version control.

5. Start the server:

```bash
node index.js
```

6. The API will be available at http://localhost:5000

API Endpoints
- GET / - Basic health check endpoint

- POST /auth/login - User login (if implemented)

- POST /auth/signup - User registration (if implemented)

- GET /applications - List job applications

- POST /applications - Add a new job application

- PUT /applications/:id - Update a job application

- DELETE /applications/:id - Delete a job application

- POST /upload - Upload resume or cover letter to S3

(More endpoints to be added as project evolves)