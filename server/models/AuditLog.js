import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true
    },
    targetType: {
      type: String,
      enum: ['User', 'Feedback', 'Analytics', 'System'],
      default: 'System'
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

auditLogSchema.statics.record = function record(payload) {
  return this.create(payload);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
