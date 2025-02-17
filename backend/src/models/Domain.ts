import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
  uuid: string;
  name: string;
  domain: string;
  description?: string;
  allowedOrigins: string[];
  settings: {
    captureErrors: boolean;
    capturePerformance: boolean;
    sampleRate: number;
  };
  stats: {
    totalErrors: number;
    totalGroups: number;
    lastErrorAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema<IDomain>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    allowedOrigins: {
      type: [String],
      default: ['*'],
    },
    settings: {
      captureErrors: { type: Boolean, default: true },
      capturePerformance: { type: Boolean, default: false },
      sampleRate: { type: Number, default: 1.0, min: 0, max: 1 },
    },
    stats: {
      totalErrors: { type: Number, default: 0 },
      totalGroups: { type: Number, default: 0 },
      lastErrorAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

export const Domain = mongoose.model<IDomain>('Domain', DomainSchema);
