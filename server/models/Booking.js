const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  numberOfTickets: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  bookingStatus: { type: String, enum: ['confirmed','cancelled','pending'], default: 'pending' },
  bookingDate: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['paid','unpaid','pending'], default: 'pending' }
});

// Compound index for fast lookup
bookingSchema.index({ user: 1, event: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
