import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  // 🔐 Authentication
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Exclude from queries by default for security
  },
  
  // 👥 Role-Based Access Control
  role: {
    type: String,
    enum: ['member', 'moderator', 'admin'],
    default: 'member'
  },
  
  // 🏢 Organization/Community Context
  organization: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    index: true // Optimize queries by org
  },
  
  // 👤 Profile & Preferences
  avatar: {
    type: String,
    default: null // URL to avatar image
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    digestFrequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'never'], 
      default: 'weekly' 
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    }
  },
  
  // 🔒 Account Security & Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false // For email verification flow
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  verificationToken: String,
  verificationTokenExpires: Date,
  
  // 📊 Activity Tracking (for analytics & audit)
  feedbackCount: {
    type: Number,
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true, // Adds createdAt & updatedAt
  toJSON: { 
    virtuals: true,
    transform: (doc, ret) => {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// 🔍 Indexes for query performance
// userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organization: 1, role: 1 });
userSchema.index({ isActive: 1, lastActiveAt: -1 });

// 🧮 Virtual: Full name (if you want to split first/last later)
userSchema.virtual('displayName').get(function() {
  return this.name.trim();
});

// 📦 Virtual: Populate user's feedback submissions (for admin views)
userSchema.virtual('feedbackSubmissions', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'submittedBy', // If you add this field to Feedback later
  justOne: false
});

// 🔐 Pre-save middleware: Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt with cost factor of 12 (balance of security & performance)
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Pre-save: Update passwordChangedAt timestamp
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // 1 second buffer for JWT timing
  next();
});

// 🔐 Pre-find: Only return active users by default
userSchema.pre(/^find/, function(next) {
  if (this.getOptions().bypassActiveFilter) {
    return next();
  }
  this.find({ isActive: { $ne: false } });
  next();
});

// ✅ Instance Method: Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ✅ Instance Method: Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, 
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false; // Password not changed
};

// ✅ Instance Method: Generate password reset token (optional enhancement)
userSchema.methods.createPasswordResetToken = function() {
  // In production: use crypto.randomBytes + store hash in DB
  // For now, return placeholder
  return Math.random().toString(36).substring(2, 15);
};

// ✅ Static Method: Find user by email (case-insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

userSchema.statics.findIncludingInactive = function(filter = {}) {
  return this.find(filter).setOptions({ bypassActiveFilter: true });
};

userSchema.statics.findOneIncludingInactive = function(filter = {}) {
  return this.findOne(filter).setOptions({ bypassActiveFilter: true });
};

userSchema.statics.findByIdIncludingInactive = function(id) {
  return this.findOne({ _id: id }).setOptions({ bypassActiveFilter: true });
};

// ✅ Static Method: Get all admins for an organization
userSchema.statics.getOrgAdmins = function(organization) {
  return this.find({ 
    organization, 
    role: 'admin', 
    isActive: true 
  }).select('-password');
};

// ✅ Static Method: Soft delete user (instead of hard delete)
userSchema.statics.softDelete = function(userId) {
  return this.findByIdAndUpdate(
    userId,
    { 
      isActive: false, 
      email: `deleted_${Date.now()}@placeholder.local` // Free up email for reuse
    },
    { new: true }
  );
};

// 🛡️ Method: Update last active timestamp
userSchema.methods.touchActivity = function() {
  this.lastActiveAt = Date.now();
  return this.save({ validateBeforeSave: false });
};

// 🎯 Method: Check if user can perform action (RBAC helper)
userSchema.methods.can = function(permission) {
  const permissions = {
    member: ['feedback:create', 'feedback:read:own', 'profile:update'],
    moderator: ['feedback:read:all', 'feedback:update', 'feedback:resolve'],
    admin: ['*', 'user:manage', 'analytics:export', 'settings:update']
  };
  
  const userPerms = permissions[this.role] || [];
  return userPerms.includes('*') || userPerms.includes(permission);
};

// 🧹 Method: Sanitize user object for API responses
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    organization: this.organization,
    avatar: this.avatar,
    bio: this.bio,
    createdAt: this.createdAt,
    lastActiveAt: this.lastActiveAt
  };
};

// 🔄 Method: Update profile (with validation)
userSchema.methods.updateProfile = async function(updates) {
  const allowedUpdates = ['name', 'bio', 'avatar', 'preferences', 'organization'];
  const sanitized = Object.keys(updates)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});
  
  Object.assign(this, sanitized);
  return await this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
