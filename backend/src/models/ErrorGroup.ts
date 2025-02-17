import mongoose, { Schema, Document } from 'mongoose';

export interface IErrorGroup extends Document {
  domainId: string;
  fingerprint: string;
  title: string;
  type: string;
  severity: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  resolvedAt?: Date;
  sampleError: {
    message: string;
    stack?: string;
    url?: string;
    source?: string;
  };
  aiAnalysis?: {
    summary: string;
    possibleCauses: string[];
    suggestions: string[];
    analyzedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ErrorGroupSchema = new Schema<IErrorGroup>(
  {
    domainId: {
      type: String,
      required: true,
      index: true,
    },
    fingerprint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: 'javascript',
    },
    severity: {
      type: String,
      default: 'medium',
    },
    count: {
      type: Number,
      default: 1,
    },
    firstSeen: {
      type: Date,
      required: true,
    },
    lastSeen: {
      type: Date,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: Date,
    sampleError: {
      message: String,
      stack: String,
      url: String,
      source: String,
    },
    aiAnalysis: {
      summary: String,
      possibleCauses: [String],
      suggestions: [String],
      analyzedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ErrorGroup = mongoose.model<IErrorGroup>('ErrorGroup', ErrorGroupSchema);
