'use client';

import { Task } from '@/types';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiCheckCircle } from 'react-icons/fi';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function TaskCard({ task, isDragging }: TaskCardProps) {
  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
          {task.title}
        </h4>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            priorityColors[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {totalSubtasks > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
          <FiCheckCircle className="w-4 h-4" />
          <span>
            {completedSubtasks}/{totalSubtasks} subtasks
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <FiCalendar className="w-3 h-3" />
            <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
          </div>
        )}

        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="flex items-center gap-1">
            <FiUser className="w-3 h-3" />
            <span>{task.assignedTo.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
