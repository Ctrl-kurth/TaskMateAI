import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Friendship from '@/lib/models/Friendship';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const friendships = await Friendship.find({
      $or: [
        { requesterId: session.user.id, status: 'accepted' },
        { recipientId: session.user.id, status: 'accepted' },
      ],
    })
      .populate('requesterId', 'name email image')
      .populate('recipientId', 'name email image');

    // Get pending friend requests
    const pendingRequests = await Friendship.find({
      recipientId: session.user.id,
      status: 'pending',
    }).populate('requesterId', 'name email image');

    return NextResponse.json({
      friends: friendships,
      pendingRequests,
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail } = body;

    await connectDB();
    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (recipient._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requesterId: session.user.id, recipientId: recipient._id },
        { requesterId: recipient._id, recipientId: session.user.id },
      ],
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friend request already exists' },
        { status: 400 }
      );
    }

    const friendship = await Friendship.create({
      requesterId: session.user.id,
      recipientId: recipient._id,
      status: 'pending',
    });

    const populatedFriendship = await Friendship.findById(friendship._id)
      .populate('requesterId', 'name email image')
      .populate('recipientId', 'name email image');

    return NextResponse.json(populatedFriendship, { status: 201 });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
