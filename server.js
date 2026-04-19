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
    // Fetch the first record from the Maintenance collection
    const firstRecord = await Maintenance.findOne();
    res.json(firstRecord || {});
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

// Get overall balance
app.get('/api/maintenance/overall-balance', async (req, res) => {
  try {
    const balanceData = await Maintenance.aggregate([
      {
        $project: {
          monthlyCollected: { $multiply: ['$amountPerPerson', '$paidMembers'] },
          monthlyExpenses: { $sum: '$expenses.amount' }
        }
      },
      {
        $group: {
          _id: null,
          overallBalance: {
            $sum: { $subtract: ['$monthlyCollected', '$monthlyExpenses'] }
          }
        }
      }
    ]);

    if (balanceData.length === 0) {
      return res.json({});
    }

    // Remove the _id from the response and send the calculated totals
    const { _id, ...result } = balanceData[0];
    res.json(result);
  } catch (error) {
    console.error('Error calculating overall balance:', error);
    res.status(500).json({ error: 'Failed to calculate overall balance' });
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

// Get a specific maintenance record by year and month
app.get('/api/maintenance/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month)) {
      return res.status(400).json({ error: 'Invalid year or month parameters' });
    }

    const maintenance = await Maintenance.findOne({ year, month });
    if (!maintenance) {
      return res.json({});
    }
    res.json(maintenance);
  } catch (error) {
    console.error(`Error fetching maintenance record for ${req.params.year}/${req.params.month}:`, error);
    res.status(500).json({ error: 'Failed to fetch maintenance record' });
  }
});

// Create a new maintenance record
app.post('/api/maintenance', async (req, res) => {
  const { year, month, amountPerPerson, paidMembers, expenses, comments, uploadedFiles } = req.body;
  console.log(`[NEW VERSION] Attempting to save data for ${month}/${year}`);

  try {
    // upsert: true will create a new record if it doesn't exist,
    // or update the existing one matching the year and month.
    const filter = { year, month };
    const update = { amountPerPerson, paidMembers, expenses, comments, uploadedFiles };
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
