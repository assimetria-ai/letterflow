import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Users,
  BarChart3,
  Send,
  TrendingUp,
  Eye,
  MousePointerClick,
  Plus,
  Upload,
  PieChart,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
  RecentActivityList,
  QuickActions,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

const recentNewsletters = [
  {
    id: 1,
    icon: Send,
    title: 'Product Update — March 2026',
    description: 'Sent to 4,821 subscribers · 41.2% open rate',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    variant: 'success',
  },
  {
    id: 2,
    icon: Mail,
    title: 'Weekly Digest #48',
    description: 'Sent to 4,756 subscribers · 38.7% open rate',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    variant: 'success',
  },
  {
    id: 3,
    icon: Mail,
    title: 'Spring Announcement',
    description: 'Scheduled · 4,821 subscribers',
    timestamp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    variant: 'warning',
  },
  {
    id: 4,
    icon: Mail,
    title: 'Q1 Recap — Draft',
    description: 'Draft · Last edited 2 days ago',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    variant: 'default',
  },
  {
    id: 5,
    icon: Send,
    title: 'February Roundup',
    description: 'Sent to 4,612 subscribers · 36.1% open rate',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    variant: 'success',
  },
]

export function DashboardPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const quickActions = [
    {
      id: 'create',
      icon: Plus,
      label: 'Create Newsletter',
      description: 'Write a new issue',
      onClick: () => navigate('/app/newsletters/new'),
    },
    {
      id: 'import',
      icon: Upload,
      label: 'Import Subscribers',
      description: 'Upload a CSV file',
      onClick: () => navigate('/app/subscribers/import'),
    },
    {
      id: 'analytics',
      icon: PieChart,
      label: 'View Analytics',
      description: 'Detailed performance',
      onClick: () => navigate('/app/analytics'),
    },
    {
      id: 'subscribers',
      icon: Users,
      label: 'Manage Subscribers',
      description: 'View & segment lists',
      onClick: () => navigate('/app/subscribers'),
    },
  ]

  return (
    <DashboardLayout>
      <DashboardLayout.Header
        title={`Welcome back, ${firstName}`}
        description="Here's how your newsletters are performing."
        actions={
          <Button
            onClick={() => navigate('/app/newsletters/new')}
            style={{ backgroundColor: '#0EA5E9' }}
            className="gap-2 hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Newsletter
          </Button>
        }
      />

      <DashboardLayout.Content>
        {/* Stats */}
        <StatCardGrid>
          <StatCard
            label="Total Subscribers"
            value="4,821"
            description="across all lists"
            trend={{ value: 12.4, direction: 'up' }}
            icon={Users}
          />
          <StatCard
            label="Open Rate"
            value="39.2%"
            description="last 30 days"
            trend={{ value: 2.1, direction: 'up' }}
            icon={Eye}
          />
          <StatCard
            label="Click Rate"
            value="6.8%"
            description="last 30 days"
            trend={{ value: 0.4, direction: 'down' }}
            icon={MousePointerClick}
          />
          <StatCard
            label="Newsletters Sent"
            value="48"
            description="this year"
            trend={{ value: 8.3, direction: 'up' }}
            icon={Send}
          />
        </StatCardGrid>

        {/* Main content area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent newsletters — takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Recent Newsletters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/newsletters')}
                className="text-sm text-muted-foreground"
              >
                View all
              </Button>
            </div>
            <RecentActivityList
              items={recentNewsletters}
              emptyMessage="No newsletters yet. Create your first one!"
              maxItems={5}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Subscriber Growth Chart placeholder */}
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Subscriber Growth</h2>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div
                className="flex h-36 flex-col items-center justify-center gap-2 rounded-md border border-dashed"
                style={{ borderColor: '#0EA5E9', backgroundColor: '#0EA5E920' }}
              >
                <TrendingUp className="h-8 w-8" style={{ color: '#0EA5E9' }} />
                <p className="text-center text-sm text-muted-foreground">
                  Growth chart coming soon
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/analytics')}
                  style={{ color: '#0EA5E9' }}
                  className="text-xs hover:opacity-80"
                >
                  View full analytics →
                </Button>
              </div>
              {/* Mini stats row */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">New this month</p>
                  <p className="mt-0.5 text-lg font-bold" style={{ color: '#0EA5E9' }}>
                    +342
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Unsubscribed</p>
                  <p className="mt-0.5 text-lg font-bold text-foreground">-18</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="mb-3 text-base font-semibold text-foreground">Quick Actions</h2>
              <QuickActions actions={quickActions} layout="list" />
            </div>
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
