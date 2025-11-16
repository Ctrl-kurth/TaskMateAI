import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import AssignedTask from '@/models/AssignedTask';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req: NextRequest) {
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

    const { taskId, assignToUserId } = await req.json();

    // Get the task to assign
    const Task = (await import('@/models/Task')).default;
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // assignToUserId is the TeamMember _id, we need to get the actual User
    const TeamMember = (await import('@/models/TeamMember')).default;
    const teamMember = await TeamMember.findById(assignToUserId);
    if (!teamMember || !teamMember.userId) {
      return NextResponse.json({ error: 'User not found or friend has not registered yet' }, { status: 404 });
    }

    // Find the actual user using the userId from team member
    const assignedToUser = await User.findById(teamMember.userId);
    if (!assignedToUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if assigning to self
    if (assignedToUser._id.toString() === decoded.userId) {
      return NextResponse.json({ error: 'Cannot assign task to yourself' }, { status: 400 });
    }

    // Get assignedBy user info
    const assignedByUser = await User.findById(decoded.userId);
    if (!assignedByUser) {
      return NextResponse.json({ error: 'Assigner not found' }, { status: 404 });
    }

    // Create assigned task using the original task data
    const assignedTask = await AssignedTask.create({
      originalTask: taskId,
      assignedBy: decoded.userId,
      assignedTo: assignedToUser._id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
      status: 'pending',
    });

    // Create notification for assigned user
    await Notification.create({
      userId: assignedToUser._id,
      type: 'task_assigned',
      message: `${assignedByUser.name} assigned you a task: "${task.title}"`,
      taskId: assignedTask._id,
      actionRequired: true,
      read: false,
    });

    return NextResponse.json({
      message: 'Task assigned successfully. Waiting for confirmation.',
      assignedTask,
    });
  } catch (error) {
    console.error('Assign task error:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    // Get pending tasks assigned to this user
    const pendingTasks = await AssignedTask.find({
      assignedTo: decoded.userId,
      status: 'pending',
    })
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ pendingTasks });
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned tasks' },
      { status: 500 }
    );
  }
}
