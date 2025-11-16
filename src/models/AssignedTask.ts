import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAssignedTask extends Document {
  originalTask: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  acceptedTaskId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  estimatedMinutes?: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const AssignedTaskSchema: Schema<IAssignedTask> = new Schema(
  {
    originalTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    acceptedTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    estimatedMinutes: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
AssignedTaskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
AssignedTaskSchema.index({ assignedBy: 1, createdAt: -1 });

const AssignedTask: Model<IAssignedTask> = 
  mongoose.models.AssignedTask || mongoose.model<IAssignedTask>('AssignedTask', AssignedTaskSchema);

export default AssignedTask;
