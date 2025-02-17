import mongoose, { Schema, Document } from 'mongoose';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorType = 'javascript' | 'network' | 'promise' | 'resource' | 'custom' | 'server';

export interface IError extends Document {
  domainId: string;
  groupId?: string;
  fingerprint: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  url?: string;
  userAgent?: string;
  ip?: string;
  metadata: Record<string, unknown>;
  breadcrumbs: Array<{
    type: string;
    message: string;
    timestamp: Date;
    data?: Record<string, unknown>;
  }>;
  resolved: boolean;
  aiAnalysis?: {
    summary: string;
    possibleCauses: string[];
    suggestions: string[];
    analyzedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ErrorSchema = new Schema<IError>(
  {
    domainId: {
      type: String,
      required: true,
      index: true,
    },
    groupId: {
      type: String,
      index: true,
    },
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['javascript', 'network', 'promise', 'resource', 'custom', 'server'],
      default: 'javascript',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    message: {
      type: String,
      required: true,
    },
    stack: String,
    source: String,
    lineno: Number,
    colno: Number,
    url: String,
    userAgent: String,
    ip: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    breadcrumbs: [
      {
        type: { type: String },
        message: String,
        timestamp: Date,
        data: Schema.Types.Mixed,
      },
    ],
    resolved: {
      type: Boolean,
      default: false,
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

export const ErrorModel = mongoose.model<IError>('Error', ErrorSchema);
