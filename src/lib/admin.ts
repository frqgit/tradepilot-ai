import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export type AdminCheck = {
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    isGlobalAdmin: boolean;
    organizationId: string;
  } | null;
};

/**
 * Check if the current user has admin privileges
 */
export async function checkAdminAccess(): Promise<AdminCheck> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { isAdmin: false, isGlobalAdmin: false, user: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isGlobalAdmin: true,
      organizationId: true,
    },
  });

  if (!user) {
    return { isAdmin: false, isGlobalAdmin: false, user: null };
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'OWNER' || user.isGlobalAdmin;
  
  return {
    isAdmin,
    isGlobalAdmin: user.isGlobalAdmin,
    user,
  };
}

/**
 * Check if user status allows app access
 */
export async function checkUserApproved(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, isGlobalAdmin: true },
  });

  if (!user) return false;
  
  // Global admins always have access
  if (user.isGlobalAdmin) return true;
  
  return user.status === 'APPROVED';
}

/**
 * Get all users for admin management (organization-scoped or global)
 */
export async function getManageableUsers(adminUser: AdminCheck['user']) {
  if (!adminUser) return [];

  const where = adminUser.isGlobalAdmin
    ? {} // Global admin sees all users
    : { organizationId: adminUser.organizationId }; // Org admin sees only their org

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isGlobalAdmin: true,
      createdAt: true,
      organization: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { status: 'asc' }, // Pending first
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Update user status (approve, reject, suspend)
 */
export async function updateUserStatus(
  userId: string,
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
  adminUser: AdminCheck['user']
) {
  if (!adminUser) throw new Error('Unauthorized');

  // Get the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, isGlobalAdmin: true },
  });

  if (!targetUser) throw new Error('User not found');

  // Check permissions
  if (!adminUser.isGlobalAdmin && targetUser.organizationId !== adminUser.organizationId) {
    throw new Error('Cannot manage users from other organizations');
  }

  // Cannot modify global admins unless you're also a global admin
  if (targetUser.isGlobalAdmin && !adminUser.isGlobalAdmin) {
    throw new Error('Cannot modify global admin');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
    },
  });
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'TRADER' | 'VIEWER',
  adminUser: AdminCheck['user']
) {
  if (!adminUser) throw new Error('Unauthorized');

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, isGlobalAdmin: true },
  });

  if (!targetUser) throw new Error('User not found');

  if (!adminUser.isGlobalAdmin && targetUser.organizationId !== adminUser.organizationId) {
    throw new Error('Cannot manage users from other organizations');
  }

  if (targetUser.isGlobalAdmin && !adminUser.isGlobalAdmin) {
    throw new Error('Cannot modify global admin');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string, adminUser: AdminCheck['user']) {
  if (!adminUser) throw new Error('Unauthorized');

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, isGlobalAdmin: true },
  });

  if (!targetUser) throw new Error('User not found');

  if (!adminUser.isGlobalAdmin && targetUser.organizationId !== adminUser.organizationId) {
    throw new Error('Cannot delete users from other organizations');
  }

  if (targetUser.isGlobalAdmin) {
    throw new Error('Cannot delete global admin');
  }

  // Cannot delete yourself
  if (userId === adminUser.id) {
    throw new Error('Cannot delete yourself');
  }

  return prisma.user.delete({
    where: { id: userId },
  });
}
