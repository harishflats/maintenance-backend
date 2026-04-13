const mongoose = require('mongoose');

const ExpenseItemSchema = new mongoose.Schema({
    id: String,
    type: String,
    amount: Number
});

const MaintenanceSchema = new mongoose.Schema({
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    amountPerPerson: { type: Number, default: 0 },
    paidMembers: { type: Number, default: 0 },
    expenses: [ExpenseItemSchema]
});

// Ensure year and month combination is unique for the update-instead-of-add logic
MaintenanceSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);