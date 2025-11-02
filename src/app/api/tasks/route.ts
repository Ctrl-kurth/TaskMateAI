import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Notification from '@/models/Notification';
import User from '@/models/User';
import TeamMember from '@/models/TeamMember';
import { getAuthUser, unauthorizedResponse } from '@/lib/middleware';

// GET - Get all tasks for the authenticated user
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build query
    const query: any = { user: authUser.userId };
    if (status && ['todo', 'inprogress', 'done'].includes(status)) {
      query.status = status;
    }

    // Fetch tasks sorted by newest first
    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

  const body = await request.json();
  const { title, description, status, priority, assignee, dueDate } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task title is required',
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task title cannot exceed 200 characters',
        },
        { status: 400 }
      );
    }

    if (description && description.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task description cannot exceed 1000 characters',
        },
        { status: 400 }
      );
    }

    if (status && !['todo', 'inprogress', 'done'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be: todo, inprogress, or done',
        },
        { status: 400 }
      );
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid priority. Must be: low, medium, or high',
        },
        { status: 400 }
      );
    }

    if (assignee && assignee.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assignee name cannot exceed 100 characters',
        },
        { status: 400 }
      );
    }

    let parsedDueDate: Date | undefined;
    if (dueDate) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid due date provided',
          },
          { status: 400 }
        );
      }
      parsedDueDate = date;
    }

    // Create task
    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: assignee?.trim() || undefined,
      dueDate: parsedDueDate,
      user: authUser.userId,
    });

    // Send notification if task is assigned to someone
    if (assignee && assignee.trim()) {
      // Find user by name (from team members)
      const assignedUser = await User.findOne({ 
        name: { $regex: new RegExp(`^${assignee.trim()}$`, 'i') } 
      });
      
      if (assignedUser) {
        // Check if the user is an accepted team member
        const teamMember = await TeamMember.findOne({
          addedBy: authUser.userId,
          userId: assignedUser._id,
          status: 'accepted'
        });

        if (!teamMember) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot assign task to ${assignee}. They need to accept your friend request first.` 
            },
            { status: 400 }
          );
        }

        const creator = await User.findById(authUser.userId);
        await Notification.create({
          userId: assignedUser._id,
          type: 'task_assigned',
          message: `${creator?.name || 'Someone'} assigned you a task: "${title}"`,
          taskId: task._id,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Task created successfully',
        task,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
