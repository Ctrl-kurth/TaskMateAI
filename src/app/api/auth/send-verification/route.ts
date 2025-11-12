import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verificationCodes } from '@/lib/verification-storage';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code with 10-minute expiration
    verificationCodes.set(email, {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Configure email transporter (using Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
      },
    });

    // Send verification email
    await transporter.sendMail({
      from: `"TaskMate AI" <noreply@taskmateai.com>`,
      replyTo: process.env.EMAIL_USER, // Keep your email for actual replies only
      to: email,
      subject: 'TaskMate AI - Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
              .code { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 5px; text-align: center; padding: 20px; background: #fff; border: 2px dashed #ccc; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>TaskMate AI</h1>
              </div>
              <div class="content">
                <h2>Email Verification</h2>
                <p>Thank you for signing up for TaskMate AI!</p>
                <p>To complete your registration, please use the verification code below:</p>
                <div class="code">${verificationCode}</div>
                <p>This code will expire in <strong>10 minutes</strong>.</p>
                <p>If you didn't request this code, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} TaskMate AI. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ 
      message: 'Verification code sent successfully',
      success: true 
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
