import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { sendDeadlineNotification } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks with deadlines in the next 24 hours that are not completed
    const upcomingTasks = await Task.find({
      dueDate: {
        $gte: now,
        $lte: twentyFourHoursFromNow,
      },
      status: { $ne: 'done' },
    }).populate('user', 'name email');

    let emailsSent = 0;
    let notificationsCreated = 0;
    const errors: string[] = [];

    for (const task of upcomingTasks) {
      try {
        const user = task.user as any;
        if (!user || !user.email) continue;

        const hoursUntilDue = (new Date(task.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60);

        // Create in-app notification
        await Notification.create({
          userId: user._id,
          type: 'task_updated',
          message: `⏰ Task "${task.title}" is due in ${Math.round(hoursUntilDue)} hours!`,
          taskId: task._id,
          read: false,
        });
        notificationsCreated++;

        // Send email notification
        await sendDeadlineNotification({
          to: user.email,
          userName: user.name,
          taskTitle: task.title,
          taskDescription: task.description,
          dueDate: task.dueDate!,
          priority: task.priority,
          hoursUntilDue,
        });
        emailsSent++;

      } catch (error: any) {
        console.error(`Failed to send notification for task ${task._id}:`, error);
        errors.push(`Task ${task.title}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Deadline check completed',
      stats: {
        tasksChecked: upcomingTasks.length,
        emailsSent,
        notificationsCreated,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('Deadline check cron error:', error);
    return NextResponse.json(
      { error: 'Failed to check deadlines', message: error.message },
      { status: 500 }
    );
  }
}
