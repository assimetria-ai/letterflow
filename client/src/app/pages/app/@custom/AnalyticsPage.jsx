// @custom — Analytics dashboard page for Letterflow
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  Users,
  Mail,
  Send,
  Calendar,
  ArrowRight,
  Minus,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

// Mock campaign data
const MOCK_CAMPAIGNS = [
  { id: 1, name: 'Product Update — March 2026', sent: '2026-03-10', recipients: 4821, openRate: 41.2, clickRate: 8.7, unsubscribes: 3 },
  { id: 2, name: 'Weekly Digest #48', sent: '2026-03-07', recipients: 4756, openRate: 38.7, clickRate: 6.2, unsubscribes: 5 },
  { id: 3, name: 'February Roundup', sent: '2026-02-28', recipients: 4612, openRate: 36.1, clickRate: 5.9, unsubscribes: 8 },
  { id: 4, name: 'Weekly Digest #47', sent: '2026-02-21', recipients: 4580, openRate: 39.4, clickRate: 7.1, unsubscribes: 2 },
  { id: 5, name: 'Valentine Special', sent: '2026-02-14', recipients: 4523, openRate: 44.8, clickRate: 11.3, unsubscribes: 1 },
  { id: 6, name: 'Weekly Digest #46', sent: '2026-02-07', recipients: 4490, openRate: 37.2, clickRate: 5.8, unsubscribes: 4 },
]

// Time range options
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

function MiniBarChart({ data, color, height = 80 }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all hover:opacity-80"
          style={{
            height: `${Math.max((val / max) * 100, 4)}%`,
            backgroundColor: color,
            opacity: 0.6 + (i / data.length) * 0.4,
          }}
          title={`${val}`}
        />
      ))}
    </div>
  )
}

function PerformanceRow({ campaign }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-foreground text-sm">{campaign.name}</p>
          <p className="text-xs text-muted-foreground">{new Date(campaign.sent).toLocaleDateString()}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{campaign.recipients.toLocaleString()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden" style={{ maxWidth: '80px' }}>
            <div className="h-full rounded-full" style={{ width: `${campaign.openRate}%`, backgroundColor: '#0EA5E9' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: '#0EA5E9' }}>{campaign.openRate}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden" style={{ maxWidth: '80px' }}>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${campaign.clickRate * 3}%` }} />
          </div>
          <span className="text-sm font-medium text-emerald-500">{campaign.clickRate}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{campaign.unsubscribes}</td>
    </tr>
  )
}

export function AnalyticsPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState('30d')

  // Aggregate stats
  const avgOpenRate = (MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.openRate, 0) / MOCK_CAMPAIGNS.length).toFixed(1)
  const avgClickRate = (MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.clickRate, 0) / MOCK_CAMPAIGNS.length).toFixed(1)
  const totalSent = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.recipients, 0)
  const totalUnsubscribes = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.unsubscribes, 0)

  // Mock chart data
  const openRateData = [38, 41, 36, 39, 44, 37, 42, 40, 38, 43, 41, 39]
  const subscriberData = [4200, 4280, 4350, 4400, 4490, 4523, 4580, 4612, 4680, 4756, 4790, 4821]

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Track your newsletter performance"
      productColor="#0EA5E9"
      navItems={LETTERFLOW_NAV_ITEMS}
    >
      <DashboardLayout.Content>
        {/* Time range selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-lg border p-0.5">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  timeRange === range.value
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="mr-1.5 h-3.5 w-3.5" /> Custom Range
          </Button>
        </div>

        {/* Stats row */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Avg. Open Rate"
            value={`${avgOpenRate}%`}
            trend={{ value: 3.2, direction: 'up' }}
            icon={Eye}
          />
          <StatCard
            label="Avg. Click Rate"
            value={`${avgClickRate}%`}
            trend={{ value: 1.8, direction: 'up' }}
            icon={MousePointerClick}
          />
          <StatCard
            label="Total Emails Sent"
            value={totalSent.toLocaleString()}
            description={`${MOCK_CAMPAIGNS.length} campaigns`}
            icon={Send}
          />
          <StatCard
            label="Unsubscribes"
            value={totalUnsubscribes.toString()}
            trend={{ value: 0.4, direction: 'down' }}
            icon={Users}
          />
        </StatCardGrid>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Open Rate Trend */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Open Rate Trend</h3>
                <p className="text-xs text-muted-foreground">Last 12 campaigns</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-500">
                <TrendingUp className="h-4 w-4" /> +3.2%
              </div>
            </div>
            <MiniBarChart data={openRateData} color="#0EA5E9" height={120} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>12 campaigns ago</span>
              <span>Latest</span>
            </div>
          </div>

          {/* Subscriber Growth */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Subscriber Growth</h3>
                <p className="text-xs text-muted-foreground">Total subscribers over time</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-500">
                <TrendingUp className="h-4 w-4" /> +14.8%
              </div>
            </div>
            <MiniBarChart data={subscriberData} color="#10B981" height={120} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>12 periods ago</span>
              <span>Current: {subscriberData[subscriberData.length - 1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Campaign Performance</h3>
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={() => navigate('/app/newsletters')}>
              View all campaigns <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Campaign</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Recipients</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Open Rate</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Click Rate</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Unsubs</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CAMPAIGNS.map(campaign => (
                <PerformanceRow key={campaign.id} campaign={campaign} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Engagement breakdown */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Top Performing</h3>
            <div className="space-y-3">
              {MOCK_CAMPAIGNS.sort((a, b) => b.openRate - a.openRate).slice(0, 3).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: '#0EA5E920', color: '#0EA5E9' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.openRate}% open · {c.clickRate}% click</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Best Send Times</h3>
            <div className="space-y-2">
              {[
                { day: 'Tuesday', time: '9:00 AM', rate: '43.2%' },
                { day: 'Thursday', time: '10:00 AM', rate: '41.8%' },
                { day: 'Monday', time: '8:00 AM', rate: '39.5%' },
              ].map((slot, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">{slot.day} · {slot.time}</span>
                  <span className="text-sm font-medium" style={{ color: '#0EA5E9' }}>{slot.rate}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Subscriber Sources</h3>
            <div className="space-y-2">
              {[
                { source: 'Landing Page', count: 2140, pct: 44 },
                { source: 'Import', count: 1450, pct: 30 },
                { source: 'API', count: 820, pct: 17 },
                { source: 'Referral', count: 411, pct: 9 },
              ].map(s => (
                <div key={s.source}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{s.source}</span>
                    <span className="text-muted-foreground">{s.count.toLocaleString()} ({s.pct}%)</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: '#0EA5E9' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
