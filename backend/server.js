const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-waste-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.then(() => console.log(`MongoDB database: ${mongoose.connection.db.databaseName}`))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bins', require('./routes/bins'));
app.use('/api/bin', require('./routes/bins'));
app.use('/api/bin-registrations', require('./routes/binRegistrations'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api', require('./routes/predictions'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
