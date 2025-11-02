import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Cleanup endpoint to remove duplicate team members
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Find all team members for this user
    const allMembers = await TeamMember.find({ addedBy: decoded.userId }).sort({ createdAt: 1 });
    
    // Group by email
    const emailGroups: { [key: string]: any[] } = {};
    allMembers.forEach(member => {
      const email = member.email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(member);
    });

    // Keep only the first member for each email, delete the rest
    let deletedCount = 0;
    for (const email in emailGroups) {
      const members = emailGroups[email];
      if (members.length > 1) {
        // Keep the first one (oldest), delete the rest
        for (let i = 1; i < members.length; i++) {
          await TeamMember.findByIdAndDelete(members[i]._id);
          deletedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Cleaned up ${deletedCount} duplicate friends`,
      deletedCount 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Failed to cleanup duplicates' }, { status: 500 });
  }
}
