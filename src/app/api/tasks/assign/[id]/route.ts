import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import AssignedTask from '@/models/AssignedTask';
import Task from '@/models/Task';
import Notification from '@/models/Notification';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const { action } = await req.json(); // 'accept' or 'reject'
    const { id } = await params;
    const assignedTaskId = id;

    // Find the assigned task
    const assignedTask = await AssignedTask.findById(assignedTaskId).populate('assignedBy', 'name email');
    
    if (!assignedTask) {
      return NextResponse.json({ error: 'Assigned task not found' }, { status: 404 });
    }

    // Verify this task is assigned to the current user
    if (assignedTask.assignedTo.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if already responded
    if (assignedTask.status !== 'pending') {
      return NextResponse.json({ error: 'Task already responded to' }, { status: 400 });
    }

    if (action === 'accept') {
      // Create the task for the assigned user
      const newTask = await Task.create({
        title: assignedTask.title,
        description: assignedTask.description,
        status: 'todo',
        priority: assignedTask.priority,
        dueDate: assignedTask.dueDate,
        estimatedMinutes: assignedTask.estimatedMinutes,
        user: decoded.userId,
        assignee: (assignedTask.assignedBy as any).name,
      });

      // Update assigned task status and store the accepted task ID
      assignedTask.status = 'accepted';
      assignedTask.acceptedTaskId = newTask._id as any;
      await assignedTask.save();

      // Notify the assigner that task was accepted
      await Notification.create({
        userId: assignedTask.assignedBy,
        type: 'task_completed',
        message: `Your task "${assignedTask.title}" was accepted!`,
        taskId: newTask._id,
        read: false,
      });

      return NextResponse.json({
        message: 'Task accepted and added to your tasks',
        task: newTask,
      });
    } else if (action === 'reject') {
      // Update assigned task status
      assignedTask.status = 'rejected';
      await assignedTask.save();

      // Notify the assigner that task was rejected
      await Notification.create({
        userId: assignedTask.assignedBy,
        type: 'task_updated',
        message: `Your task "${assignedTask.title}" was rejected`,
        read: false,
      });

      return NextResponse.json({
        message: 'Task rejected',
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Respond to assigned task error:', error);
    return NextResponse.json(
      { error: 'Failed to respond to task assignment' },
      { status: 500 }
    );
  }
}
