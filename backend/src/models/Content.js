import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

export const Content = mongoose.model('Content', contentSchema);
