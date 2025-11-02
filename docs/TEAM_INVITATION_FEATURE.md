# Team Invitation & Confirmation System

## Overview
Added a confirmation system for team invitations. Users must accept invitations before they can be assigned tasks.

## Features Implemented

### 1. **Team Member Status System**
- **Pending**: Initial state when someone is added to a team
- **Accepted**: User confirmed they want to join the team
- **Declined**: User rejected the invitation

### 2. **Invitation Notifications**
- When you add someone to your team by email, they receive a special invitation notification
- Notifications have **Accept** and **Decline** buttons
- Only users with registered accounts (matching email) receive notifications

### 3. **Task Assignment Protection**
- You can ONLY assign tasks to team members who have **accepted** your invitation
- Attempting to assign to pending/declined members shows an error message
- The assignee dropdown only shows accepted team members

### 4. **Team Modal Updates**
- Shows status badges for all team members:
  - 🟢 **✓ Accepted** (green)
  - 🔴 **✗ Declined** (red)
  - 🟡 **⏳ Pending** (yellow)
- Displays total member count (including pending)

## How It Works

### Invitation Flow:
1. **User A** adds **User B** to their team using User B's email
2. If User B has an account with that email, they receive an **invitation notification**
3. User B sees the notification with Accept/Decline buttons
4. User B clicks **Accept** or **Decline**
5. User A gets notified of User B's response
6. If accepted, User A can now assign tasks to User B

### API Endpoints

#### 1. POST `/api/team` - Add Team Member
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "member"
}
```
- Creates team member with `status: 'pending'`
- Sends invitation notification if user account exists

#### 2. PUT `/api/team/invitation` - Accept/Decline Invitation
```json
{
  "teamMemberId": "123456789",
  "action": "accept" // or "decline"
}
```
- Updates team member status
- Marks notification as read
- Notifies the inviter

#### 3. GET `/api/team` - Fetch Team Members
- Default: Returns only **accepted** members (for assignee dropdown)
- With `?showAll=true`: Returns all members (for team modal)

## Database Schema Changes

### TeamMember Model
```typescript
{
  name: String,
  email: String,
  role: String,
  status: 'pending' | 'accepted' | 'declined', // NEW
  userId: ObjectId, // NEW - links to User account
  addedBy: ObjectId,
  createdAt: Date
}
```

### Notification Model
```typescript
{
  userId: ObjectId,
  type: 'team_invitation' | ..., // NEW type
  message: String,
  teamMemberId: ObjectId, // NEW - links to TeamMember
  actionRequired: Boolean, // NEW - shows action buttons
  read: Boolean,
  createdAt: Date
}
```

## UI Components

### Notification Dropdown
- Shows invitation notifications with Accept/Decline buttons
- Buttons only appear for `team_invitation` type with `actionRequired: true`
- Clicking a button triggers the invitation response

### Team Modal
- Lists all team members (including pending)
- Shows status badge next to each member
- Pending members are visible but cannot be assigned tasks

## Testing Instructions

### Test Case 1: Successful Invitation Flow
1. **Account A**: Add team member with Account B's email
2. **Account B**: Login and check notifications (bell icon)
3. **Account B**: Click "Accept" on the invitation
4. **Account A**: Should see notification "User B accepted your team invitation"
5. **Account A**: Can now assign tasks to User B

### Test Case 2: Declined Invitation
1. **Account A**: Add team member with Account B's email
2. **Account B**: Click "Decline" on the invitation
3. **Account A**: Should see "User B declined your team invitation"
4. **Account A**: Cannot assign tasks to User B (shows as "Declined" in team modal)

### Test Case 3: Task Assignment Protection
1. **Account A**: Add team member (pending status)
2. **Account A**: Try to create/assign task to that member
3. Should see error: "Cannot assign task to [name]. They need to accept your team invitation first."

### Test Case 4: Pending Member Display
1. **Account A**: Add team member
2. **Account A**: Open Team modal
3. Should see member with "⏳ Pending" badge
4. Member does NOT appear in assignee dropdown

## Important Notes

- ✅ Email matching is case-insensitive
- ✅ Users without accounts can still be added (for reference), but won't get notifications
- ✅ Declined invitations can be removed and re-sent
- ✅ Notifications poll every 10 seconds for real-time updates
- ✅ Accept/Decline actions immediately update the UI

## Files Modified

1. `models/TeamMember.ts` - Added status and userId fields
2. `models/Notification.ts` - Added team_invitation type, teamMemberId, actionRequired
3. `app/api/team/route.ts` - Updated to create invitation notifications
4. `app/api/team/invitation/route.ts` - NEW endpoint for accept/decline
5. `app/api/tasks/route.ts` - Added validation for accepted members
6. `app/api/tasks/[id]/route.ts` - Added validation for task updates
7. `app/dashboard/page.tsx` - Added invitation UI and response handler

## Future Enhancements

- [ ] Email notifications (in addition to in-app)
- [ ] Invitation expiry (auto-decline after X days)
- [ ] Re-invite functionality for declined invitations
- [ ] Batch invitation (add multiple members at once)
- [ ] Custom invitation message
