'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Ban, 
  Trash2, 
  Shield,
  Mail,
  Calendar
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    chats: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--text-secondary)]">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">User Management</h1>
        <p className="text-[var(--text-secondary)] mt-2">Manage user accounts and permissions</p>
      </div>

      {/* Search and Stats */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
          />
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-6 py-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-color)]" />
            <span className="text-[var(--text-primary)] font-semibold">{users.length}</span>
            <span className="text-[var(--text-secondary)]">Total Users</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <tr>
              <th className="text-left px-6 py-4 text-[var(--text-secondary)] font-medium">User</th>
              <th className="text-left px-6 py-4 text-[var(--text-secondary)] font-medium">Role</th>
              <th className="text-left px-6 py-4 text-[var(--text-secondary)] font-medium">Status</th>
              <th className="text-left px-6 py-4 text-[var(--text-secondary)] font-medium">Chats</th>
              <th className="text-left px-6 py-4 text-[var(--text-secondary)] font-medium">Joined</th>
              <th className="text-left px-6 py-4 text-[var(--text-secondary)] font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white font-semibold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">
                        {user.name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-1 text-[var(--text-secondary)] text-sm">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/10 text-purple-500' 
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    user.isActive 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {user.isActive ? 'Active' : 'Banned'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[var(--text-primary)]">{user._count.chats}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-[var(--text-secondary)] text-sm">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="p-2 hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                    </button>
                    
                    {activeMenu === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            handleToggleStatus(user.id, user.isActive);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-primary)]"
                        >
                          <Ban className="w-4 h-4" />
                          {user.isActive ? 'Ban User' : 'Unban User'}
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteUser(user.id);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
