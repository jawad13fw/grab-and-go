import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: String },
  responses: [{
    from: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

ticketSchema.index({ userId: 1 });
ticketSchema.index({ status: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
