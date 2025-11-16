import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStatus = 'todo' | 'inprogress' | 'done';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
  user: mongoose.Types.ObjectId;
  estimatedMinutes?: number;
  actualMinutes?: number;
  pomodoroSessions?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    status: {
      type: String,
      enum: ['todo', 'inprogress', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    assignee: {
      type: String,
      trim: true,
      maxlength: [100, 'Assignee cannot be more than 100 characters'],
    },
    dueDate: {
      type: Date,
    },
    estimatedMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    actualMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    pomodoroSessions: {
      type: Number,
      min: 0,
      default: 0,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
TaskSchema.index({ user: 1, createdAt: -1 });

// Prevent model recompilation in development
const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
