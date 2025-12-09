import { prisma } from '@/lib/prisma';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

async function getAnalytics() {
  try {
    const [
      totalUsers,
      totalChats,
      totalMessages,
      recentUsers,
      recentChats,
      analyticsData
    ] = await Promise.all([
      prisma.user.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        }
      }),
      prisma.chat.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            }
          },
          _count: {
            select: { messages: true }
          }
        }
      }),
      // Aggregate API usage across ALL users
      prisma.analytics.aggregate({
        _sum: {
          apiCalls: true,
          serpApiCalls: true,
          factCheckApiCalls: true,
          geminiApiCalls: true,
          visionApiCalls: true,
          sightEngineApiCalls: true,
          searchApiCalls: true,
          totalChats: true,
          totalMessages: true,
          totalImages: true,
          aiGenerated: true,
          realImages: true,
          truthyContent: true,
          falseContent: true,
        }
      })
    ]);

    // Transform aggregated data to match expected format
    const analytics = {
      apiCalls: analyticsData._sum.apiCalls || 0,
      serpApiCalls: analyticsData._sum.serpApiCalls || 0,
      factCheckApiCalls: analyticsData._sum.factCheckApiCalls || 0,
      geminiApiCalls: analyticsData._sum.geminiApiCalls || 0,
      visionApiCalls: analyticsData._sum.visionApiCalls || 0,
      sightEngineApiCalls: analyticsData._sum.sightEngineApiCalls || 0,
      searchApiCalls: analyticsData._sum.searchApiCalls || 0,
      totalChats: analyticsData._sum.totalChats || 0,
      totalMessages: analyticsData._sum.totalMessages || 0,
      totalImages: analyticsData._sum.totalImages || 0,
      aiGenerated: analyticsData._sum.aiGenerated || 0,
      realImages: analyticsData._sum.realImages || 0,
      truthyContent: analyticsData._sum.truthyContent || 0,
      falseContent: analyticsData._sum.falseContent || 0,
    };

    return {
      totalUsers,
      totalChats,
      totalMessages,
      recentUsers,
      recentChats,
      analytics
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return {
      totalUsers: 0,
      totalChats: 0,
      totalMessages: 0,
      recentUsers: [],
      recentChats: [],
      analytics: null
    };
  }
}

export default async function AdminDashboard() {
      const data = await getAnalytics();

  const stats = [
    {
      title: 'Total Users',
      value: data.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Chats',
      value: data.totalChats,
      icon: MessageSquare,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Messages',
      value: data.totalMessages,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'API Calls',
      value: data.analytics?.apiCalls || 0,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // API Usage breakdown
  const apiUsage = [
    { name: 'SERP API', calls: data.analytics?.serpApiCalls || 0, color: 'bg-blue-500' },
    { name: 'Fact Check API', calls: data.analytics?.factCheckApiCalls || 0, color: 'bg-green-500' },
    { name: 'Gemini API', calls: data.analytics?.geminiApiCalls || 0, color: 'bg-purple-500' },
    { name: 'Vision API', calls: data.analytics?.visionApiCalls || 0, color: 'bg-orange-500' },
    { name: 'SightEngine API', calls: data.analytics?.sightEngineApiCalls || 0, color: 'bg-pink-500' },
    { name: 'Search API', calls: data.analytics?.searchApiCalls || 0, color: 'bg-cyan-500' },
  ];

  const totalApiCalls = apiUsage.reduce((sum, api) => sum + api.calls, 0);  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-2">Monitor your application metrics and user activity</p>
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
              </div>
              <h3 className="text-[var(--text-secondary)] text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-[var(--text-primary)]">
                {stat.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Content Analysis */}
      {data.analytics && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Content Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">Truthy Content</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {data.analytics.truthyContent.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">False Content</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {data.analytics.falseContent.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Activity className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">AI Generated</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {data.analytics.aiGenerated.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Usage Breakdown */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          API Usage Statistics
        </h2>
        <div className="space-y-4">
          {apiUsage.map((api) => (
            <div key={api.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${api.color}`}></div>
                  <span className="text-[var(--text-primary)] font-medium">{api.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {totalApiCalls > 0 ? ((api.calls / totalApiCalls) * 100).toFixed(1) : 0}%
                  </span>
                  <span className="text-[var(--text-primary)] font-semibold min-w-[60px] text-right">
                    {api.calls.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className={`h-full ${api.color} transition-all duration-500`}
                  style={{
                    width: totalApiCalls > 0 ? `${(api.calls / totalApiCalls) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Total API Requests</span>
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {totalApiCalls.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Recent Users</h2>
          <div className="space-y-3">
            {data.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">
                      {user.name || 'Anonymous'}
                    </p>
                    <p className="text-[var(--text-secondary)] text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                  <Clock className="w-4 h-4" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Recent Chats</h2>
          <div className="space-y-3">
            {data.recentChats.map((chat) => (
              <div
                key={chat.id}
                className="p-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--text-primary)] font-medium">
                    {chat.title || 'Untitled Chat'}
                  </p>
                  <span className="text-[var(--text-secondary)] text-sm">
                    {chat._count.messages} messages
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                  <span>{chat.user.name || chat.user.email}</span>
                  <span>•</span>
                  <span>{new Date(chat.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
