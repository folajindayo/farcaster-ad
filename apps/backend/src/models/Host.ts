import mongoose, { Document, Schema } from 'mongoose';

export interface IHost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  preferences: Record<string, unknown>;
  totalEarnings: number;
  pendingEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

const HostSchema = new Schema<IHost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    type: Schema.Types.Mixed,
    default: {}
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingEarnings: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'hosts'
});

// Indexes for performance
HostSchema.index({ userId: 1 });

export const Host = mongoose.model<IHost>('Host', HostSchema);
