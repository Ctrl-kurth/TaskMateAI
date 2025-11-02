import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Notification from '@/models/Notification';
import User from '@/models/User';
import TeamMember from '@/models/TeamMember';
import { getAuthUser, unauthorizedResponse } from '@/lib/middleware';

// GET - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const task = await Task.findOne({
      _id: id,
      user: authUser.userId,
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('Get task error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
  const { title, description, status, priority, assignee, dueDate } = body;

    // Validation
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task title cannot be empty',
        },
        { status: 400 }
      );
    }

    if (title && title.length > 200) {
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
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        parsedDueDate = undefined;
      } else {
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
    }

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (assignee !== undefined) updateData.assignee = assignee?.trim() || undefined;
  if (dueDate !== undefined) updateData.dueDate = parsedDueDate;

    // Get old task data before update
    const oldTask = await Task.findOne({ _id: id, user: authUser.userId });

    // Update task
    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        user: authUser.userId,
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    // Send notifications for assignment changes
    if (assignee !== undefined && oldTask) {
      const newAssignee = assignee?.trim();
      const oldAssignee = oldTask.assignee;
      
      // If assignee changed and there's a new assignee
      if (newAssignee && newAssignee !== oldAssignee) {
        const assignedUser = await User.findOne({ 
          name: { $regex: new RegExp(`^${newAssignee}$`, 'i') } 
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
                error: `Cannot assign task to ${newAssignee}. They need to accept your friend request first.` 
              },
              { status: 400 }
            );
          }

          const updater = await User.findById(authUser.userId);
          await Notification.create({
            userId: assignedUser._id,
            type: 'task_assigned',
            message: `${updater?.name || 'Someone'} assigned you a task: "${task.title}"`,
            taskId: task._id,
          });
        }
      }
    }

    // Send notification if status changed to done
    if (status === 'done' && oldTask && oldTask.status !== 'done' && oldTask.assignee) {
      const assignedUser = await User.findOne({ 
        name: { $regex: new RegExp(`^${oldTask.assignee}$`, 'i') } 
      });
      
      if (assignedUser && (assignedUser._id as any).toString() !== authUser.userId) {
        const completer = await User.findById(authUser.userId);
        await Notification.create({
          userId: assignedUser._id,
          type: 'task_completed',
          message: `${completer?.name || 'Someone'} completed the task: "${task.title}"`,
          taskId: task._id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authUser = getAuthUser(request);
    if (!authUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    const task = await Task.findOneAndDelete({
      _id: id,
      user: authUser.userId,
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete task',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
