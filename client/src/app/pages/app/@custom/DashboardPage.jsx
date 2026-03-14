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
  Zap,
  Layout,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Globe,
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

// Overview cards for all 8 MVP features
const FEATURE_CARDS = [
  {
    icon: Mail,
    label: 'Newsletters',
    value: '48 sent',
    meta: '3 drafts',
    color: '#0EA5E9',
    to: '/app/newsletters',
  },
  {
    icon: Users,
    label: 'Subscribers',
    value: '4,821',
    meta: '+342 this month',
    color: '#10B981',
    to: '/app/subscribers',
  },
  {
    icon: Send,
    label: 'Email Sending',
    value: '98.7%',
    meta: 'delivery rate',
    color: '#6366F1',
    to: '/app/sending',
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    value: '39.2%',
    meta: 'avg open rate',
    color: '#F59E0B',
    to: '/app/analytics',
  },
  {
    icon: Zap,
    label: 'Automations',
    value: '3 active',
    meta: '2,065 enrolled',
    color: '#EF4444',
    to: '/app/automations',
  },
  {
    icon: Layout,
    label: 'Landing Pages',
    value: '3 live',
    meta: '16.7% avg CVR',
    color: '#8B5CF6',
    to: '/app/landing-pages',
  },
  {
    icon: FlaskConical,
    label: 'A/B Tests',
    value: '2 running',
    meta: '+4.1% lift found',
    color: '#06B6D4',
    to: '/app/ab-tests',
  },
  {
    icon: Upload,
    label: 'Import/Export',
    value: '14,200',
    meta: 'records synced',
    color: '#84CC16',
    to: '/app/import-export',
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
      onClick: () => navigate('/app/import-export'),
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
    <DashboardLayout navItems={LETTERFLOW_NAV_ITEMS}>
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
        {/* Top stats */}
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

        {/* Feature overview grid — all 8 MVP features */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Platform Overview</h2>
            <span className="text-xs text-muted-foreground">All features at a glance</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURE_CARDS.map(card => (
              <button
                key={card.label}
                onClick={() => navigate(card.to)}
                className="group rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-opacity-80"
                style={{ '--hover-color': card.color }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${card.color}18` }}
                  >
                    <card.icon className="h-4 w-4" style={{ color: card.color }} />
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-0.5 text-base font-bold text-foreground">{card.value}</p>
                <p className="mt-0.5 text-xs" style={{ color: card.color }}>{card.meta}</p>
              </button>
            ))}
          </div>
        </div>

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

            {/* Deliverability health */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Deliverability</h2>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Delivery Rate', value: '98.7%', ok: true },
                  { label: 'Bounce Rate', value: '0.57%', ok: true },
                  { label: 'SPF / DKIM', value: 'Valid', ok: true },
                  { label: 'DMARC Policy', value: 'Quarantine', ok: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`flex items-center gap-1 font-medium ${item.ok ? 'text-emerald-500' : 'text-amber-500'}`}>
                      <CheckCircle className="h-3 w-3" />
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/sending')}
                className="mt-3 w-full justify-between text-xs text-muted-foreground"
              >
                View sending details
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
