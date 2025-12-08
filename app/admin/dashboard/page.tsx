'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin stats
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        // Fetch users (admin endpoint)
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users);
        }

        // Fetch audit logs
        const logsRes = await fetch('/api/admin/audit-logs');
        if (logsRes.ok) {
          const data = await logsRes.json();
          setAuditLogs(data.logs);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" />
          <StatCard title="Total Chats" value={stats?.totalChats || 0} icon="💬" />
          <StatCard title="Images Processed" value={stats?.totalImages || 0} icon="🖼️" />
          <StatCard title="API Calls" value={stats?.totalApiCalls || 0} icon="📊" />
        </div>

        {/* Users table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Chats</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user._count?.chats || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:underline mr-4">View</button>
                      <button className="text-red-600 hover:underline">Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit logs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{log.action}</p>
                    <p className="text-sm text-gray-600">User: {log.userId}</p>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
