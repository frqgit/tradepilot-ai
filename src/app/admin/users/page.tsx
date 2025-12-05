'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Button, Card, Badge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';

interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  isGlobalAdmin: boolean;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-slate-100 text-slate-800',
};

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  TRADER: 'bg-slate-100 text-slate-800',
  VIEWER: 'bg-slate-100 text-slate-600',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.status === 403) {
        router.push('/deals');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setIsAdmin(data.isAdmin);
        setIsGlobalAdmin(data.isGlobalAdmin);
        setCurrentUserId(data.currentUserId);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      return;
    }
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = filterStatus === 'all' 
    ? users 
    : users.filter(u => u.status === filterStatus);

  const pendingCount = users.filter(u => u.status === 'PENDING').length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            {isGlobalAdmin && (
              <Badge variant="info" size="sm">Global Admin</Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            {isGlobalAdmin 
              ? 'Manage all users across all organizations' 
              : 'Manage users in your organization'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-slate-500">Total Users</div>
            <div className="text-2xl font-bold text-slate-900">{users.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Pending Approval</div>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'APPROVED').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-slate-500">Suspended</div>
            <div className="text-2xl font-bold text-slate-600">
              {users.filter(u => u.status === 'SUSPENDED').length}
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
              {status === 'PENDING' && pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">User</th>
                  {isGlobalAdmin && (
                    <th className="text-left p-4 font-medium text-slate-600">Organization</th>
                  )}
                  <th className="text-left p-4 font-medium text-slate-600">Role</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Joined</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {user.name || 'Unnamed'}
                            {user.isGlobalAdmin && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    {isGlobalAdmin && (
                      <td className="p-4 text-slate-600">{user.organization.name}</td>
                    )}
                    <td className="p-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === user.id || user.isGlobalAdmin || user.id === currentUserId}
                        className={`text-sm px-3 py-1.5 rounded-lg border border-slate-200 ${roleColors[user.role]} ${
                          user.isGlobalAdmin || user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="TRADER">Trader</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {formatRelativeTime(user.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {user.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleStatusChange(user.id, 'APPROVED')}
                              loading={actionLoading === user.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(user.id, 'REJECTED')}
                              loading={actionLoading === user.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {user.status === 'APPROVED' && !user.isGlobalAdmin && user.id !== currentUserId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                            loading={actionLoading === user.id}
                          >
                            Suspend
                          </Button>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(user.id, 'APPROVED')}
                            loading={actionLoading === user.id}
                          >
                            Reactivate
                          </Button>
                        )}
                        {user.status === 'REJECTED' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleStatusChange(user.id, 'APPROVED')}
                            loading={actionLoading === user.id}
                          >
                            Approve
                          </Button>
                        )}
                        {!user.isGlobalAdmin && user.id !== currentUserId && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                            loading={actionLoading === user.id}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={isGlobalAdmin ? 6 : 5} className="p-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
