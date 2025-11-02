import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import Notification from '@/models/Notification';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Get filter from query params - if showAll=true, show all, otherwise only accepted
    const url = new URL(req.url);
    const showAll = url.searchParams.get('showAll') === 'true';
    
    const query: any = { addedBy: decoded.userId };
    if (!showAll) {
      query.status = 'accepted';
    }
    
    const members = await TeamMember.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { name, email, role, avatar } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if this email is already added to the team
    const existingMember = await TeamMember.findOne({ 
      addedBy: decoded.userId, 
      email: email.toLowerCase() 
    });
    
    if (existingMember) {
      return NextResponse.json({ 
        error: 'This email is already in your friends list' 
      }, { status: 400 });
    }

    // Check if the added person has an account by email
    const addedUser = await User.findOne({ email: email.toLowerCase() });
    
    const member = await TeamMember.create({
      name,
      email,
      role: role || 'friend',
      avatar: avatar || '',
      addedBy: decoded.userId,
      status: addedUser ? 'pending' : 'pending', // pending if user exists, otherwise just pending
      userId: addedUser?._id,
    });

    // Get the user who added the member
    const adder = await User.findById(decoded.userId);
    const adderName = adder?.name || 'Someone';
    
    // If they have an account, send them an invitation notification
    if (addedUser) {
      await Notification.create({
        userId: addedUser._id,
        type: 'team_invitation',
        message: `${adderName} sent you a friend request`,
        teamMemberId: member._id,
        actionRequired: true,
        read: false,
      });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
  }
}
