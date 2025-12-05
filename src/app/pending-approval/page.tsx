'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserStatus {
  id: string;
  email: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

export default function PendingApprovalPage() {
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch and check status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          setUserStatus(data);
          if (data.status === 'APPROVED') {
            router.push('/deals');
          }
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    const interval = setInterval(fetchStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [router]);

  const getStatusMessage = () => {
    switch (userStatus?.status) {
      case 'PENDING':
        return {
          icon: '⏳',
          title: 'Awaiting Approval',
          message: 'Your account is pending administrator approval. You will be notified once your access has been granted.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
        };
      case 'REJECTED':
        return {
          icon: '❌',
          title: 'Access Denied',
          message: 'Your account access request has been declined. Please contact an administrator if you believe this is an error.',
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
        };
      case 'SUSPENDED':
        return {
          icon: '🚫',
          title: 'Account Suspended',
          message: 'Your account has been temporarily suspended. Please contact an administrator for more information.',
          color: 'text-slate-600',
          bgColor: 'bg-slate-50 border-slate-200',
        };
      default:
        return {
          icon: '⏳',
          title: 'Processing...',
          message: 'Please wait while we verify your account status.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
        };
    }
  };

  const status = getStatusMessage();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Trade<span className="text-blue-600">Pilot</span>.AI
          </h1>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl p-8 border ${status.bgColor}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">{status.icon}</div>
            <h2 className={`text-2xl font-bold mb-2 ${status.color}`}>
              {status.title}
            </h2>
            <p className="text-slate-600 mb-6">
              {status.message}
            </p>
            
            {userStatus?.status === 'PENDING' && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Auto-checking every 10 seconds...
              </div>
            )}

            <div className="text-sm text-slate-500 mb-6">
              Logged in as: <strong>{userStatus?.email}</strong>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Need help? Contact your organization administrator</p>
        </div>
      </div>
    </div>
  );
}
