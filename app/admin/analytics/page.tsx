import { prisma } from '@/lib/prisma';
import { 
  TrendingUp, 
  Activity, 
  Users,
  MessageSquare,
  BarChart3,
  PieChart
} from 'lucide-react';

async function getDetailedAnalytics() {
  try {
    const [
      totalUsers,
      totalChats,
      totalMessages,
      analytics,
      userGrowth,
      chatsByDay
    ] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.analytics.findFirst({
        orderBy: { updatedAt: 'desc' }
      }),
      // Get user registrations in last 30 days
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: true,
        orderBy: { createdAt: 'desc' },
        take: 30
      }),
      // Get chats created per day
      prisma.chat.groupBy({
        by: ['createdAt'],
        _count: true,
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    return {
      totalUsers,
      totalChats,
      totalMessages,
      analytics,
      userGrowth,
      chatsByDay
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return {
      totalUsers: 0,
      totalChats: 0,
      totalMessages: 0,
      analytics: null,
      userGrowth: [],
      chatsByDay: []
    };
  }
}

export default async function AnalyticsPage() {
  const data = await getDetailedAnalytics();

  const stats = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Chats',
      value: data.totalChats,
      change: '+8.3%',
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Messages',
      value: data.totalMessages,
      change: '+23.1%',
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'API Calls',
      value: data.analytics?.apiCalls || 0,
      change: '+15.7%',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-2">Detailed insights and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-green-500 text-sm font-medium">{stat.change}</span>
              </div>
              <h3 className="text-[var(--text-secondary)] text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {stat.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Content Quality */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <PieChart className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Content Quality</h2>
              <p className="text-[var(--text-secondary)] text-sm">Fact-check analysis breakdown</p>
            </div>
          </div>
          {data.analytics && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">Truthy Content</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {data.analytics.truthyContent}
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(data.analytics.truthyContent / (data.analytics.truthyContent + data.analytics.falseContent)) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">False Content</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {data.analytics.falseContent}
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${(data.analytics.falseContent / (data.analytics.truthyContent + data.analytics.falseContent)) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">AI Generated</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {data.analytics.aiGenerated}
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${(data.analytics.aiGenerated / data.totalMessages) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[var(--text-secondary)]">Real Images</span>
                  <span className="text-[var(--text-primary)] font-semibold">
                    {data.analytics.realImages}
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(data.analytics.realImages / (data.analytics.realImages + data.analytics.aiGenerated)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usage Trends */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Usage Trends</h2>
              <p className="text-[var(--text-secondary)] text-sm">Activity over time</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-[var(--text-secondary)] text-sm mb-1">Avg. Chats/User</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {data.totalUsers > 0 ? (data.totalChats / data.totalUsers).toFixed(1) : 0}
                </p>
              </div>
              <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-[var(--text-secondary)] text-sm mb-1">Avg. Messages/Chat</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {data.totalChats > 0 ? (data.totalMessages / data.totalChats).toFixed(1) : 0}
                </p>
              </div>
            </div>
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-[var(--text-secondary)] text-sm mb-1">New Users (30 days)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {data.userGrowth.length}
              </p>
            </div>
            <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <p className="text-[var(--text-secondary)] text-sm mb-1">Active Chats (30 days)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {data.chatsByDay.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Performance Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[var(--border-color)]">
              <tr>
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Metric</th>
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Value</th>
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--border-color)]">
                <td className="py-3 px-4 text-[var(--text-primary)]">Total API Calls</td>
                <td className="py-3 px-4 text-[var(--text-primary)] font-semibold">
                  {data.analytics?.apiCalls.toLocaleString() || 0}
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">Normal</span>
                </td>
              </tr>
              <tr className="border-b border-[var(--border-color)]">
                <td className="py-3 px-4 text-[var(--text-primary)]">Total Chats</td>
                <td className="py-3 px-4 text-[var(--text-primary)] font-semibold">
                  {data.totalChats.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">Active</span>
                </td>
              </tr>
              <tr className="border-b border-[var(--border-color)]">
                <td className="py-3 px-4 text-[var(--text-primary)]">Total Messages</td>
                <td className="py-3 px-4 text-[var(--text-primary)] font-semibold">
                  {data.totalMessages.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">Growing</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
