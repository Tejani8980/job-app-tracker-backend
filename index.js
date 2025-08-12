const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const applicationsRouter = require('./routes/applicationsRouter');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);

app.use('/api/applications', applicationsRouter);

app.get('/', (req, res) => {
  res.send('Job Application Tracker API running...');
});
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
