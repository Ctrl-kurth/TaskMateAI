'use client';

import { useState, useEffect } from 'react';
import { Task, SubTask } from '@/types';
import { FiX, FiPlus, FiTrash2, FiZap } from 'react-icons/fi';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  task,
}: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: undefined,
    assignedTo: [],
    subtasks: [],
  });
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: undefined,
        assignedTo: [],
        subtasks: [],
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleGenerateSubtasks = async () => {
    if (!formData.title) {
      alert('Please enter a task title first');
      return;
    }

    setIsGeneratingSubtasks(true);
    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskTitle: formData.title,
          taskDescription: formData.description,
        }),
      });

      const data = await response.json();
      const newSubtasks: SubTask[] = data.subtasks.map((st: { title: string; description?: string }, index: number) => ({
        id: `${Date.now()}-${index}`,
        title: st.title,
        completed: false,
      }));

      setFormData((prev) => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), ...newSubtasks],
      }));
    } catch (error) {
      console.error('Error generating subtasks:', error);
      alert('Failed to generate subtasks');
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const addSubtask = () => {
    const newSubtask: SubTask = {
      id: `${Date.now()}`,
      title: '',
      completed: false,
    };
    setFormData((prev) => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), newSubtask],
    }));
  };

  const updateSubtask = (index: number, updates: Partial<SubTask>) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks?.map((st, i) =>
        i === index ? { ...st, ...updates } : st
      ),
    }));
  };

  const removeSubtask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks?.filter((_, i) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as Task['status'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value as Task['priority'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={
                formData.dueDate
                  ? new Date(formData.dueDate).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dueDate: e.target.value ? new Date(e.target.value) : undefined,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subtasks
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateSubtasks}
                  disabled={isGeneratingSubtasks}
                  className="text-sm flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50"
                >
                  <FiZap className="w-4 h-4" />
                  {isGeneratingSubtasks ? 'Generating...' : 'AI Generate'}
                </button>
                <button
                  type="button"
                  onClick={addSubtask}
                  className="text-sm flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <FiPlus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {formData.subtasks?.map((subtask, index) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) =>
                      updateSubtask(index, { completed: e.target.checked })
                    }
                    className="rounded"
                  />
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) =>
                      updateSubtask(index, { title: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Subtask title"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubtask(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
