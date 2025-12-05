import { NextRequest, NextResponse } from 'next/server';
import { 
  checkAdminAccess, 
  getManageableUsers, 
  updateUserStatus, 
  updateUserRole,
  deleteUser 
} from '@/lib/admin';

// GET /api/admin/users - List all users for admin
export async function GET() {
  try {
    const adminCheck = await checkAdminAccess();
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await getManageableUsers(adminCheck.user);

    return NextResponse.json({
      users,
      isAdmin: adminCheck.isAdmin,
      isGlobalAdmin: adminCheck.isGlobalAdmin,
      currentUserId: adminCheck.user?.id,
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user status or role
export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, status, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let result;
    
    if (status) {
      if (!['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      result = await updateUserStatus(userId, status, adminCheck.user);
    } else if (role) {
      if (!['OWNER', 'ADMIN', 'TRADER', 'VIEWER'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      result = await updateUserRole(userId, role, adminCheck.user);
    } else {
      return NextResponse.json({ error: 'Status or role required' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 400 });
  }
}

// DELETE /api/admin/users?userId=xxx - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await checkAdminAccess();
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await deleteUser(userId, adminCheck.user);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 400 });
  }
}
