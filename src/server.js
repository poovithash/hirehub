const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
const EMAIL_USER = 'mail@gmail.com'; 
const EMAIL_PASS = 'password';
// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Ensure Uploads folder exists
const uploadsDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(UploadsDir);
}

// Multer setup for file uploads (used for recruiter registration)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date() + path.extname(file.originalname)); 
  },
});

// Allow PNG, JPG, and PDF file types
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/; 
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only PNG, JPG, and PDF files are allowed')); 
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

const resstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); 
  },
});

// File filter to allow only PDF files for resumes
const resumeFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only PDF files are allowed for resumes'), false); // Reject the file
  }
};

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
connectToDatabase();

const db = client.db('job-portal');
const usersCollection = db.collection('users');
const recruitersCollection = db.collection('recruiters');
const jobsCollection = db.collection('jobs');
const applicationsCollection = db.collection('jobApplications');

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// User Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, age, gender, email, password, phone ,experience,skills} = req.body;

    // Validation
    if (!name || !age || !gender || !email || !password || !phone ||!experience ||!skills) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

  
    const newUser = {
      name,
      age: parseInt(age),
      gender,
      email,
      password: hashedPassword,
      phone,
      experience,
      skills,
      role: 'user',
      createdAt: new Date(),
    };

    // Insert user into database
    await usersCollection.insertOne(newUser);

    // Generate JWT
    const token = jwt.sign(
      { email: newUser.email, role: 'user' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ message: 'Registration successful', token, name: newUser.name });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { email: user.email, role: 'user' },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token, name: user.name ,email:user.email,phone:user.phone});
    console.log(res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Recruiter Register endpoint
app.post('/api/recruiter-register', upload.single('companyLogo'), async (req, res) => {
  try {
    const {
      email,
      password,
      companyName,
      websiteLink,
      companyDescription,
      phone,
      address,
      industry,
    } = req.body;
    const companyLogo = req.file ? `/uploads/${req.file.filename}` : '';

    // Validation
    if (
      !email ||
      !password ||
      !companyName ||
      !websiteLink ||
      !companyDescription ||
      !phone ||
      !address ||
      !industry ||
      !companyLogo
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password closes be at least 6 characters' });
    }
    if (!/https?:\/\/.+/.test(websiteLink)) {
      return res.status(400).json({ message: 'Invalid website URL' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be a 10-digit number' });
    }

    // Check for existing email
    const existingRecruiter = await recruitersCollection.findOne({ email });
    if (existingRecruiter) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new recruiter
    const newRecruiter = {
      email,
      password: hashedPassword,
      companyName,
      websiteLink,
      companyDescription,
      companyLogo,
      phone,
      address,
      industry,
      role: 'recruiter',
      createdAt: new Date(),
    };

    // Insert recruiter into database
    await recruitersCollection.insertOne(newRecruiter);

    res.status(201).json({ message: 'Recruiter registered successfully' });
  } catch (error) {
    console.error('Recruiter signup error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Recruiter Login endpoint
app.post('/api/recruiter-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find recruiter by email
    const recruiter = await recruitersCollection.findOne({ email });
    if (!recruiter) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, recruiter.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { email: recruiter.email, role: 'recruiter', companyId: recruiter.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token, name: recruiter.companyName });
  } catch (error) {
    console.error('Recruiter login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Job-related endpoints
// Get company name for logged-in recruiter
app.get('/api/company', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const recruiter = await recruitersCollection.findOne({ email: req.user.email });
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    res.json({ companyName: recruiter.companyName });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all jobs posted by the recruiter's company
app.get('/api/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const jobs = await jobsCollection.find({ companyId: req.user.companyId }).toArray();
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

app.get('/api/alljobs', async (req, res) => {
  try {
    const jobs = await jobsCollection.find().toArray();
    console.log('Jobs fetched:', jobs);
    const userId = req.user ? (await usersCollection.findOne({ email: req.user.email }))?._id.toString() : null;
    console.log(req.user);
    const jobsWithDetails = await Promise.all(
      jobs.map(async (job) => {
        // Query the recruiters collection using email instead of ObjectId
        const recruiter = await recruitersCollection.findOne({ email: job.companyId });
        let isApplied = false;
        if (userId) {
          const application = await applicationsCollection.findOne({
            userId,
            jobId: job._id.toString(),
          });
          isApplied = !application;
        }
        console.log(isApplied);
        return {
          _id: job._id.toString(),
          title: job.title,
          description: job.description,
          experience: job.experience || 'N/A', // Default value if experience is null
          salary: job.salary,
          location: job.location,
          companyName: recruiter ? recruiter.companyName : 'Unknown',
          logoPath: recruiter ? recruiter.logoPath : '',
          isApplied,
        };
      })
    );

    res.json(jobsWithDetails);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});



// Get a single job by ID
app.get('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const job = await jobsCollection.findOne({
      _id: new ObjectId(req.params.id),
      companyId: req.user.companyId
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Error fetching job' });
  }
});

// Create a new job
app.post('/api/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const recruiter = await recruitersCollection.findOne({ email: req.user.email });
    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    const job = {
      title: req.body.title,
      description: req.body.description,
      companyName: recruiter.companyName,
      location: req.body.location,
      salary: parseFloat(req.body.salary) || 0,
      type: req.body.type,
      experience: req.body.experience,
      status: req.body.status || 'Open',
      companyId: req.user.companyId,
      createdAt: new Date()
    };
    const result = await jobsCollection.insertOne(job);
    res.status(201).json({ _id: result.insertedId, ...job });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ message: 'Error posting job' });
  }
});

// Update an existing job
app.put('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    console.log('PUT /api/jobs/:id - JWT User:', req.user);
    if (req.user.role !== 'recruiter') {
      console.log('Access denied: User role is not recruiter');
      return res.status(403).json({ message: 'Access denied' });
    }
    const recruiter = await recruitersCollection.findOne({ email: req.user.email });
    if (!recruiter) {
      console.log('Recruiter not found for email:', req.user.email);
      return res.status(404).json({ message: 'Recruiter not found' });
    }
    console.log('Recruiter found:', recruiter);
    const jobUpdate = {
      title: req.body.title,
      description: req.body.description,
      companyName: recruiter.companyName,
      location: req.body.location,
      salary: parseFloat(req.body.salary) || 0,
      type: req.body.type,
      experience: req.body.experience,
      status: req.body.status || 'Open'
    };
    console.log('Updating job ID:', req.params.id, 'with data:', jobUpdate);
    const result = await jobsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), companyId: req.user.companyId },
      { $set: jobUpdate },
      { returnDocument: 'after' }
    );
    if (!result) {
      console.log('Job not found for ID:', req.params.id, 'companyId:', req.user.companyId);
      return res.status(404).json({ message: 'Job not found' });
    }
    console.log('Job updated successfully:', result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Error updating job' });
  }
});


app.post('/api/jobs/search', async (req, res) => {
  try {
    console.log('POST /api/jobs/search - Request body:', req.body);
    const { title, location, experience } = req.body;

    const query = {};
    if (title) {
      query.title = { $regex: title, $options: 'i' }; // Case-insensitive partial match
      console.log('Searching jobs with title regex:', query.title);
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' }; // Case-insensitive partial match
      console.log('Searching jobs with location regex:', query.location);
    }
    if (experience) {
      query.experience = experience; // Exact match
      console.log('Searching jobs with experience:', experience);
    }
    console.log('Final query:', query);

    const jobs = await jobsCollection.find(query).toArray();
    console.log('Jobs found:', jobs.length, 'results');

    const jobsWithDetails = await Promise.all(
      jobs.map(async (job) => {
        const recruiter = await recruitersCollection.findOne({ email: job.companyId });
        return {
          _id: job._id.toString(),
          title: job.title,
          description: job.description,
          experience: job.experience || 'N/A',
          salary: job.salary || 0,
          location: job.location || 'N/A',
          skills: job.skills || [],
          type: job.type || 'N/A',
          status: job.status || 'Open',
          createdAt: job.createdAt,
          companyName: recruiter ? recruiter.companyName : 'Unknown',
          logoPath: recruiter ? recruiter.companyLogo : '',
        };
      })
    );

    console.log('Returning jobs with details:', jobsWithDetails.length, 'results');
    res.status(200).json(jobsWithDetails);
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ message: 'Error searching jobs' });
  }
});

//delete job
app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const result = await jobsCollection.deleteOne({
      _id: new ObjectId(req.params.id),
      companyId: req.user.companyId,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Job not found or not authorized' });
    }
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
});

// Apply for a job
const uploadResume = multer({ storage: resstorage, fileFilter: resumeFileFilter });
app.post('/api/jobs/:jobId/apply', authenticateToken, uploadResume.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      console.log('Access denied: Only users can apply for jobs');
      return res.status(403).json({ error: 'Access denied' });
    }

    const { userName } = req.body;
    const jobId = req.params.jobId;
    const resumePath = req.file ? req.file.path : null;

    // Validate inputs
    if (!userName || !resumePath) {
      console.log('Missing required fields:', { userName, resumePath });
      return res.status(400).json({ error: 'User name and resume are required.' });
    }

    // Fetch user details
    const user = await usersCollection.findOne({ email: req.user.email });
    if (!user) {
      console.log('User not found for email:', req.user.email);
      return res.status(404).json({ error: 'User not found.' });
    }

    // Fetch job details
    const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    if (!job) {
      console.log('Job not found for ID:', jobId);
      return res.status(404).json({ error: 'Job not found.' });
    }

    // Check if user has already applied
    const existingApplication = await applicationsCollection.findOne({
      userId: user._id.toString(),
      jobId,
    });
    if (existingApplication) {
      console.log('Application already exists for userId:', user._id.toString(), 'jobId:', jobId);
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    // Create new application
    const application = {
      userId: user._id.toString(),
      userName,
      email: user.email,
      phoneNumber: user.phone,
      jobId,
      companyName: job.companyName || 'Unknown',
      resumeUrl: resumePath,
      appliedAt: new Date(),
      status: 'Pending',
    };

    console.log('POST /api/jobs/:jobId/apply - Application data:', application);

    const result = await applicationsCollection.insertOne(application);
    console.log('Application submitted successfully:', result.insertedId);

    res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

//endpoint to fetch all applications for the logged-in user
app.get('/api/applications/user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Use userId if available, else fetch user by email
    let userId = req.user.userId;
    if (!userId) {
      const user = await usersCollection.findOne({ email: req.user.email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      userId = user._id.toString();
    }

    console.log('Fetching applications for userId:', userId);

    const applications = await applicationsCollection
      .aggregate([
        { $match: { userId } },
        {
          $addFields: {
            jobIdObjectId: { $toObjectId: '$jobId' } // Convert jobId string to ObjectId
          }
        },
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobIdObjectId',
            foreignField: '_id',
            as: 'jobDetails',
          },
        },
        { $unwind: { path: '$jobDetails', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            jobId: '$jobId',
            title: '$jobDetails.title',
            companyName: '$companyName',
            salary: '$jobDetails.salary',
            status: '$status',
            appliedAt: '$appliedAt',
          },
        },
      ])
      .toArray();

    const formattedApplications = applications.map(app => ({
      jobId: app.jobId?.toString() || 'Unknown',
      title: app.title || 'Unknown',
      companyName: app.companyName || 'Unknown',
      salary: app.salary || 0,
      status: app.status || 'Unknown',
      appliedAt: app.appliedAt || null,
    }));

    console.log('Fetched applications:', applications);
    res.json(formattedApplications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// New endpoints for viewing applicants and managing applications
app.get('/api/jobs/:jobId/applicants', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const job = await jobsCollection.findOne({
      _id: new ObjectId(req.params.jobId),
      companyId: req.user.companyId,
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or not authorized' });
    }

    const applicants = await applicationsCollection
      .find({ jobId: req.params.jobId })
      .toArray();
    console.log('Applicants found for jobId', req.params.jobId, ':', applicants); // Debug log

    const formattedApplicants = applicants.map((applicant) => ({
      _id: applicant._id.toString(),
      name: applicant.userName,
      email: applicant.email,
      resumeUrl: applicant.resumeUrl.replace(/\\/g, '/'),
      status: applicant.status || 'Pending',
    }));

    console.log('Formatted applicants:', formattedApplicants); // Debug log
    res.json(formattedApplicants);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ message: 'Error fetching applicants' });
  }
});

app.put('/api/jobs/:jobId/applicants/:applicantId/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch the job first to ensure the user has access to it
    const job = await jobsCollection.findOne({
      _id: new ObjectId(req.params.jobId),
      companyId: req.user.companyId,
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found or not authorized' });
    }

    // Fetch the application to ensure it exists
    const application = await applicationsCollection.findOne({
      _id: new ObjectId(req.params.applicantId),
      jobId: req.params.jobId,
    });
    console.log(req.params.applicantId);
    console.log(req.params.jobId);
    console.log(application);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected', 'waitlisted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update the application status
    const result = await applicationsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.params.applicantId), jobId: req.params.jobId },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    // Check if the update was successful
    console.log("result",result);
    if (!result) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Log the updated application for debugging
    console.log('Updated application:', result);

    res.json({ message: 'Status updated', application: result });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
});
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 456,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

app.post('/api/send-email', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'To, subject, and body are required' });
    }

    const mailOptions = {
      from: EMAIL_USER,
      to,
      subject,
      text: body,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
