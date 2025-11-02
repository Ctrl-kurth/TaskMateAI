import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import Notification from '@/models/Notification';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { teamMemberId, action } = await req.json();

    if (!teamMemberId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Find the team member invitation
    const teamMember = await TeamMember.findById(teamMemberId);
    
    if (!teamMember) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this invitation is for the current user
    if (teamMember.userId?.toString() !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the team member status
    teamMember.status = action === 'accept' ? 'accepted' : 'declined';
    await teamMember.save();

    // Mark the invitation notification as read
    await Notification.updateOne(
      { teamMemberId: teamMemberId, userId: decoded.userId },
      { read: true, actionRequired: false }
    );

    // Get user details
    const inviter = await User.findById(teamMember.addedBy);
    const currentUser = await User.findById(decoded.userId);
    
    // If accepted, create a reverse friendship so both users see each other in their friends list
    if (action === 'accept' && currentUser && inviter) {
      // Check if reverse friendship already exists
      const existingReverse = await TeamMember.findOne({
        addedBy: decoded.userId,
        userId: teamMember.addedBy
      });

      if (!existingReverse) {
        // Create reverse friendship
        await TeamMember.create({
          name: inviter.name,
          email: inviter.email,
          role: teamMember.role || 'friend',
          avatar: '',
          addedBy: decoded.userId,
          status: 'accepted', // Auto-accept since they accepted our request
          userId: inviter._id,
        });
      }
    }
    
    // Notify the person who sent the invitation
    if (inviter) {
      await Notification.create({
        userId: inviter._id,
        type: 'team_added',
        message: `${currentUser?.name || 'Someone'} ${action === 'accept' ? 'accepted' : 'declined'} your friend request`,
        read: false,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Friend request ${action}ed successfully`,
      status: teamMember.status 
    });
  } catch (error) {
    console.error('Invitation response error:', error);
    return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
  }
}
