import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export interface DeadlineEmailData {
  to: string;
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: Date;
  priority: string;
  hoursUntilDue: number;
}

export async function sendDeadlineNotification(data: DeadlineEmailData) {
  const { to, userName, taskTitle, taskDescription, dueDate, priority, hoursUntilDue } = data;

  const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#3b82f6';
  const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🔵';

  const timeText = 
    hoursUntilDue < 1 ? 'less than an hour' :
    hoursUntilDue < 24 ? `${Math.round(hoursUntilDue)} hours` :
    `${Math.round(hoursUntilDue / 24)} days`;

  const mailOptions = {
    from: `"TaskMate AI" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⏰ Deadline Reminder: ${taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .task-card { background-color: #f9fafb; border-left: 4px solid ${priorityColor}; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .task-title { font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 10px; }
            .task-description { color: #6b7280; margin-bottom: 15px; line-height: 1.5; }
            .deadline-warning { background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .deadline-warning strong { color: #92400e; }
            .task-details { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
            .detail-item { display: flex; align-items: center; gap: 8px; color: #4b5563; font-size: 14px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Deadline Reminder</h1>
            </div>
            <div class="content">
              <p style="color: #374151; font-size: 16px;">Hi ${userName},</p>
              <p style="color: #374151; font-size: 16px;">You have a task deadline approaching soon!</p>
              
              <div class="deadline-warning">
                <strong>⚠️ Due in ${timeText}</strong>
              </div>

              <div class="task-card">
                <div class="task-title">${priorityEmoji} ${taskTitle}</div>
                ${taskDescription ? `<div class="task-description">${taskDescription}</div>` : ''}
                <div class="task-details">
                  <div class="detail-item">
                    <span>📅</span>
                    <span><strong>Due:</strong> ${new Date(dueDate).toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div class="detail-item">
                    <span>🎯</span>
                    <span><strong>Priority:</strong> ${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                  </div>
                </div>
              </div>

              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="btn">View Task in Dashboard →</a>
              </center>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                💡 <strong>Tip:</strong> Break down large tasks into smaller sub-tasks and use the Pomodoro Timer to stay focused!
              </p>
            </div>
            <div class="footer">
              <p>You're receiving this email because you have an upcoming task deadline in TaskMate AI.</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} TaskMate AI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Deadline notification sent to ${to} for task: ${taskTitle}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send deadline notification:', error);
    throw error;
  }
}
