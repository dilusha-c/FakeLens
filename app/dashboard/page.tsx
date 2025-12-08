'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch analytics
        const analyticsRes = await fetch('/api/analytics');
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data.analytics);
        }

        // Fetch chats
        const chatsRes = await fetch('/api/chats');
        if (chatsRes.ok) {
          const data = await chatsRes.json();
          setChats(data.chats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={() => router.push('/chat')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Chats"
            value={analytics?.totalChats || 0}
            icon="📊"
          />
          <StatCard
            title="Messages"
            value={analytics?.totalMessages || 0}
            icon="💬"
          />
          <StatCard
            title="Images Analyzed"
            value={analytics?.totalImages || 0}
            icon="🖼️"
          />
          <StatCard
            title="AI Generated"
            value={analytics?.aiGenerated || 0}
            icon="🤖"
          />
        </div>

        {/* Recent chats */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Recent Chats</h2>
          </div>
          <div className="divide-y">
            {chats.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No chats yet. <a href="/chat" className="text-blue-600 hover:underline">Start one now</a>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => router.push(`/chat?id=${chat.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
                >
                  <h3 className="font-semibold text-gray-800">{chat.title}</h3>
                  <p className="text-sm text-gray-600">
                    {chat.messages.length} messages • {new Date(chat.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fact-check stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Content Verification</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Verified Content</span>
                <span className="font-bold text-green-600">{analytics?.truthyContent || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">False Content</span>
                <span className="font-bold text-red-600">{analytics?.falseContent || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">API Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">API Calls</span>
                <span className="font-bold">{analytics?.apiCalls || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Active</span>
                <span className="font-bold">{new Date(analytics?.lastActive).toLocaleDateString()}</span>
              </div>
            </div>
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
