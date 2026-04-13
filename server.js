require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Maintenance = require('./Maintenance');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test MongoDB connection
app.get('/api/test-db', async (req, res) => {
  try {
    // Simple test to check if we can access the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    res.json({ 
      message: 'MongoDB connection test successful',
      database: db.databaseName,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection test failed', details: error.message });
  }
});

// Get all maintenance records
app.get('/api/maintenance', async (req, res) => {
  try {
    console.log('Fetching maintenance records...');
    const maintenance = await Maintenance.find().sort({ createdAt: -1 });
    console.log('Found records:', maintenance.length);
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
});

// Get a specific maintenance record by ID
app.get('/api/maintenance/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance record' });
  }
});

// Create a new maintenance record
app.post('/api/maintenance', async (req, res) => {
  const { year, month, amountPerPerson, paidMembers, expenses } = req.body;
  console.log(`[NEW VERSION] Attempting to save data for ${month}/${year}`);

  try {
    // upsert: true will create a new record if it doesn't exist,
    // or update the existing one matching the year and month.
    const filter = { year, month };
    const update = { amountPerPerson, paidMembers, expenses };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };

    const savedRecord = await Maintenance.findOneAndUpdate(filter, update, options);
    res.status(200).json({ message: 'Data saved successfully', data: savedRecord });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save maintenance record' });
  }
});

// Update a maintenance record
app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    res.json(maintenance);
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({ error: 'Failed to update maintenance record' });
  }
});

// Delete a maintenance record
app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete maintenance record' });
  }
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in the .env file');
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 [NEW VERSION] Server is actually running on port ${PORT}`);
});
