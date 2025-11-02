export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  userId: string;
  assignedTo?: string[];
  subtasks?: SubTask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Friendship {
  _id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'friend_request' | 'task_due_soon';
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: Date;
}

export interface AIBreakdownRequest {
  taskTitle: string;
  taskDescription: string;
}

export interface AIBreakdownResponse {
  subtasks: {
    title: string;
    description: string;
  }[];
}
