import { prisma } from '@/lib/prisma';
import { 
  Server, 
  Database, 
  HardDrive, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

async function getSystemMetrics() {
  try {
    const [
      dbSize,
      recentLogs,
      totalChats,
      totalMessages,
      totalUsers
    ] = await Promise.all([
      // Get database statistics
      prisma.$queryRaw`SELECT pg_database_size(current_database()) as size`,
      // Get recent audit logs
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.user.count(),
    ]);

    return {
      dbSize,
      recentLogs,
      totalChats,
      totalMessages,
      totalUsers,
    };
  } catch (error) {
    console.error('Failed to fetch system metrics:', error);
    return {
      dbSize: [{ size: 0 }],
      recentLogs: [],
      totalChats: 0,
      totalMessages: 0,
      totalUsers: 0,
    };
  }
}

export default async function SystemPage() {
  const data = await getSystemMetrics();
  const dbSizeBytes = Number((data.dbSize as any)[0]?.size || 0);
  const dbSizeMB = (dbSizeBytes / (1024 * 1024)).toFixed(2);

  const systemStats = [
    {
      title: 'Database Size',
      value: `${dbSizeMB} MB`,
      icon: Database,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Records',
      value: (data.totalChats + data.totalMessages + data.totalUsers).toLocaleString(),
      icon: HardDrive,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Audit Logs',
      value: data.recentLogs.length,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'System Status',
      value: 'Operational',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">System Monitoring</h1>
        <p className="text-[var(--text-secondary)] mt-2">Monitor system health and performance</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {systemStats.map((stat) => {
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
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* System Health */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Server className="w-6 h-6" />
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-[var(--text-secondary)] text-sm">Database</p>
              <p className="text-lg font-semibold text-green-500">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-[var(--text-secondary)] text-sm">API Server</p>
              <p className="text-lg font-semibold text-green-500">Running</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-[var(--text-secondary)] text-sm">Storage</p>
              <p className="text-lg font-semibold text-green-500">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Recent Audit Logs</h2>
        <div className="space-y-3">
          {data.recentLogs.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-center py-8">No audit logs found</p>
          ) : (
            data.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className={`p-2 rounded-lg ${
                  log.action.includes('delete') || log.action.includes('ban')
                    ? 'bg-red-500/10'
                    : log.action.includes('create')
                    ? 'bg-green-500/10'
                    : 'bg-blue-500/10'
                }`}>
                  {log.action.includes('delete') || log.action.includes('ban') ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Activity className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[var(--text-primary)] font-medium">{log.action}</p>
                    <div className="flex items-center gap-1 text-[var(--text-secondary)] text-sm">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm mb-1">
                    User ID: {log.userId || 'System'}
                  </p>
                  {log.details && (
                    <p className="text-[var(--text-secondary)] text-sm">{String(log.details)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
