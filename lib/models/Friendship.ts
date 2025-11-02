import mongoose, { Schema, models } from 'mongoose';

const FriendshipSchema = new Schema(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate friendships
FriendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Friendship = models.Friendship || mongoose.model('Friendship', FriendshipSchema);

export default Friendship;
