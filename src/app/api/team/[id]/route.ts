import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { id } = await params;

    // Verify the team member belongs to the user before deleting
    const member = await TeamMember.findOne({ _id: id, addedBy: decoded.userId });
    
    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    await TeamMember.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Friend removed successfully' 
    });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);
    const { id } = await params;
    const updates = await req.json();

    const member = await TeamMember.findByIdAndUpdate(id, updates, { new: true });
    
    return NextResponse.json({ member });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}
