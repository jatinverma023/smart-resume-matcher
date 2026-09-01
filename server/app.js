const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const matchRoutes = require('./routes/matchRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const path = require('path');
app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);


app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Resume Matcher API is running',
    });
});

module.exports = app;