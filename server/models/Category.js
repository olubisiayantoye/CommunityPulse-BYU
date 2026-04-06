import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    default: 'MessageSquare',
    enum: ['MessageSquare', 'Shield', 'Brain', 'BarChart3', 'Users', 'AlertTriangle', 'CheckCircle', 'Settings', 'Home', 'Briefcase', 'Heart', 'Star']
  },
  color: {
    type: String,
    default: 'indigo',
    enum: ['indigo', 'blue', 'green', 'red', 'orange', 'purple', 'pink', 'yellow', 'teal']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  feedbackCount: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient querying
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1, order: 1 });

// Pre-save: Update feedback count (optional enhancement)
categorySchema.pre('save', function(next) {
  // Can add logic to update feedback count from Feedback model
  next();
});

export default mongoose.model('Category', categorySchema);