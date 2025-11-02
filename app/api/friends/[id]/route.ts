import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Friendship from '@/lib/models/Friendship';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    await connectDB();
    const friendship = await Friendship.findById(id);

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Only the recipient can update the status
    if (friendship.recipientId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this request' },
        { status: 403 }
      );
    }

    friendship.status = status;
    await friendship.save();

    const populatedFriendship = await Friendship.findById(friendship._id)
      .populate('requesterId', 'name email image')
      .populate('recipientId', 'name email image');

    return NextResponse.json(populatedFriendship);
  } catch (error) {
    console.error('Error updating friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    const friendship = await Friendship.findByIdAndDelete(id);

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Friendship deleted successfully' });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
