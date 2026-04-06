import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Feedback content is required'],
    trim: true,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  category: {
  type: String,
  required: [true, 'Category is required'],
  trim: true,
  maxlength: [100, 'Category name cannot exceed 100 characters'],
  
},
  // AI-Generated Fields
  sentiment: {
    label: { type: String, enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'], default: 'NEUTRAL' },
    score: { type: Number, default: 1.0, min: 0, max: 1 }
  },
  keywords: [{ type: String }], // Extracted via NLP
  // Community Engagement
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  // Status Tracking
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  adminNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  // Metadata (anonymous by design)
  isAnonymous: { type: Boolean, default: true },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: {
    platform: {
      type: String,
      enum: ['Web', 'Mobile', 'Tablet', 'API', 'Other'],
      default: 'Web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
feedbackSchema.index({ category: 1, sentiment: 1, status: 1 });
feedbackSchema.index({ submittedAt: -1 });
feedbackSchema.index({ submittedBy: 1, submittedAt: -1 });

// Virtual for priority scoring
feedbackSchema.virtual('priorityScore').get(function() {
  let score = 0;
  if (this.sentiment.label === 'NEGATIVE') score += 3;
  if (this.upvoteCount >= 10) score += 2;
  else if (this.upvoteCount >= 5) score += 1;
  if (this.status === 'Pending') score += 1;
  return score;
});

export default mongoose.model('Feedback', feedbackSchema);
