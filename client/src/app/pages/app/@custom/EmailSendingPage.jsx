// @custom — Email Sending & Deliverability page for Letterflow
import { useState } from 'react'
import {
  Send,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Mail,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Settings,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

const MOCK_SEND_HISTORY = [
  {
    id: 1,
    campaign: 'Product Update — March 2026',
    sentAt: '2026-03-10T09:00:00',
    recipients: 4821,
    delivered: 4789,
    bounces: 32,
    complaints: 2,
    bounceRate: 0.66,
    complaintRate: 0.04,
    status: 'sent',
  },
  {
    id: 2,
    campaign: 'Weekly Digest #48',
    sentAt: '2026-03-07T09:15:00',
    recipients: 4756,
    delivered: 4731,
    bounces: 25,
    complaints: 1,
    bounceRate: 0.53,
    complaintRate: 0.02,
    status: 'sent',
  },
  {
    id: 3,
    campaign: 'Spring Announcement',
    sentAt: '2026-03-16T10:00:00',
    recipients: 4821,
    delivered: null,
    bounces: null,
    complaints: null,
    bounceRate: null,
    complaintRate: null,
    status: 'scheduled',
  },
  {
    id: 4,
    campaign: 'February Roundup',
    sentAt: '2026-02-28T09:00:00',
    recipients: 4612,
    delivered: 4587,
    bounces: 25,
    complaints: 3,
    bounceRate: 0.54,
    complaintRate: 0.07,
    status: 'sent',
  },
  {
    id: 5,
    campaign: 'Test Campaign — Removed',
    sentAt: '2026-02-25T14:30:00',
    recipients: 150,
    delivered: 98,
    bounces: 52,
    complaints: 5,
    bounceRate: 34.7,
    complaintRate: 3.3,
    status: 'failed',
    failReason: 'Bounce rate exceeded threshold (34.7%)',
  },
  {
    id: 6,
    campaign: 'Weekly Digest #47',
    sentAt: '2026-02-21T09:00:00',
    recipients: 4580,
    delivered: 4558,
    bounces: 22,
    complaints: 1,
    bounceRate: 0.48,
    complaintRate: 0.02,
    status: 'sent',
  },
]

const DNS_RECORDS = [
  {
    type: 'SPF',
    record: 'v=spf1 include:sendgrid.net ~all',
    status: 'valid',
    description: 'Authorizes Letterflow to send on your behalf',
  },
  {
    type: 'DKIM',
    record: 'letterflow._domainkey.yourdomain.com',
    status: 'valid',
    description: 'Cryptographic signature for email authentication',
  },
  {
    type: 'DMARC',
    record: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com',
    status: 'warning',
    description: 'Policy is set to quarantine — consider upgrading to reject',
  },
  {
    type: 'Custom Domain',
    record: 'mail.yourdomain.com',
    status: 'valid',
    description: 'Sending from your own domain improves deliverability',
  },
]

function DeliverabilityScore({ score }) {
  const color = score >= 90 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444'
  const label = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Attention'
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex items-center gap-6">
      {/* Circular progress */}
      <div className="relative flex h-24 w-24 items-center justify-center flex-shrink-0">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{score}</p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold" style={{ color }}>{label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">Deliverability score</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <CheckCircle className="h-3 w-3" /> SPF & DKIM configured
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-500">
            <AlertCircle className="h-3 w-3" /> DMARC policy not enforced
          </div>
        </div>
      </div>
    </div>
  )
}

function DnsRecord({ record }) {
  const StatusIcon = record.status === 'valid' ? CheckCircle : record.status === 'warning' ? AlertCircle : XCircle
  const statusColor = record.status === 'valid' ? 'text-emerald-500' : record.status === 'warning' ? 'text-amber-500' : 'text-red-500'

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <StatusIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${statusColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {record.type}
          </span>
          <code className="text-xs text-muted-foreground truncate">{record.record}</code>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{record.description}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status, failReason }) {
  const config = {
    sent: { label: 'Sent', color: 'bg-emerald-500/10 text-emerald-500', Icon: CheckCircle },
    sending: { label: 'Sending', color: 'bg-sky-500/10 text-sky-500', Icon: RefreshCw },
    scheduled: { label: 'Scheduled', color: 'bg-violet-500/10 text-violet-500', Icon: Clock },
    failed: { label: 'Failed', color: 'bg-red-500/10 text-red-500', Icon: XCircle },
  }
  const { label, color, Icon } = config[status] ?? config.sent
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`} title={failReason}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function RateCell({ rate, threshold }) {
  if (rate === null || rate === undefined) return <span className="text-muted-foreground">—</span>
  const isHigh = rate > threshold
  return (
    <span className={`text-sm font-medium ${isHigh ? 'text-red-500' : 'text-foreground'}`}>
      {rate.toFixed(2)}%
      {isHigh && <AlertCircle className="ml-1 inline h-3.5 w-3.5 text-red-500" />}
    </span>
  )
}

export function EmailSendingPage() {
  const [activeTab, setActiveTab] = useState('history')

  const sentCampaigns = MOCK_SEND_HISTORY.filter(c => c.status === 'sent')
  const avgBounceRate = sentCampaigns.length > 0
    ? (sentCampaigns.reduce((s, c) => s + c.bounceRate, 0) / sentCampaigns.length).toFixed(2)
    : '0'
  const totalDelivered = sentCampaigns.reduce((s, c) => s + (c.delivered ?? 0), 0)
  const deliveryRate = sentCampaigns.reduce((s, c) => s + c.recipients, 0)
  const overallDeliveryRate = deliveryRate > 0
    ? ((totalDelivered / deliveryRate) * 100).toFixed(1)
    : '0'

  const TABS = [
    { id: 'history', label: 'Send History' },
    { id: 'dns', label: 'DNS & Authentication' },
    { id: 'settings', label: 'Sending Settings' },
  ]

  return (
    <DashboardLayout
      title="Email Sending"
      subtitle="Monitor deliverability and sending infrastructure"
      productColor="#0EA5E9"
      navItems={LETTERFLOW_NAV_ITEMS}
    >
      <DashboardLayout.Content>
        {/* Stats */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Delivery Rate"
            value={`${overallDeliveryRate}%`}
            description="emails successfully delivered"
            trend={{ value: 0.3, direction: 'up' }}
            icon={Send}
          />
          <StatCard
            label="Avg. Bounce Rate"
            value={`${avgBounceRate}%`}
            description="target: below 2%"
            trend={{ value: 0.1, direction: 'down' }}
            icon={TrendingDown}
          />
          <StatCard
            label="Total Delivered"
            value={totalDelivered.toLocaleString()}
            description="all time"
            icon={Mail}
          />
          <StatCard
            label="DNS Health"
            value="3 / 4"
            description="records valid"
            icon={ShieldCheck}
          />
        </StatCardGrid>

        {/* Deliverability overview card */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Score */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Deliverability Score</h3>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </div>
            <DeliverabilityScore score={87} />
          </div>

          {/* Rate chart */}
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Bounce & Complaint Rates</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-muted-foreground">Bounce Rate</span>
                  <span className="font-medium text-foreground">{avgBounceRate}% avg</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(parseFloat(avgBounceRate) * 20, 100)}%`,
                      backgroundColor: parseFloat(avgBounceRate) > 2 ? '#EF4444' : '#10B981',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="text-amber-500">⚠ 2% threshold</span>
                  <span>5%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-muted-foreground">Complaint Rate</span>
                  <span className="font-medium text-foreground">0.03% avg</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: '6%' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="text-amber-500">⚠ 0.1% threshold</span>
                  <span>0.5%</span>
                </div>
              </div>

              <div className="rounded-md bg-emerald-500/10 p-3">
                <p className="text-xs font-medium text-emerald-600">
                  Your bounce and complaint rates are within healthy limits. Keep it up!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                style={activeTab === tab.id ? { borderColor: '#0EA5E9', color: '#0EA5E9' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Send History Tab */}
          {activeTab === 'history' && (
            <div className="mt-4 rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Recent Campaigns</h3>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Filter by date
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Campaign</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Sent At</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Recipients</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Delivered</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Bounce Rate</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Complaint Rate</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_SEND_HISTORY.map(campaign => (
                      <tr key={campaign.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{campaign.campaign}</p>
                          {campaign.failReason && (
                            <p className="text-xs text-red-500 mt-0.5">{campaign.failReason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(campaign.sentAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {campaign.recipients.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {campaign.delivered != null ? campaign.delivered.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <RateCell rate={campaign.bounceRate} threshold={2} />
                        </td>
                        <td className="px-4 py-3">
                          <RateCell rate={campaign.complaintRate} threshold={0.1} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={campaign.status} failReason={campaign.failReason} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DNS Tab */}
          {activeTab === 'dns' && (
            <div className="mt-4 rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">DNS & Authentication Records</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Verify your domain setup for maximum deliverability</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" /> DNS Guide
                </Button>
              </div>
              <div>
                {DNS_RECORDS.map(record => (
                  <DnsRecord key={record.type} record={record} />
                ))}
              </div>
              <div className="mt-4 rounded-md bg-amber-500/10 p-3">
                <p className="text-xs font-medium text-amber-600 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  Your DMARC policy is set to quarantine. Upgrade to reject for stronger protection against spoofing.
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Sending Limits</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Daily Send Limit', value: '50,000 emails' },
                    { label: 'Rate Limit', value: '1,000 / hour' },
                    { label: 'Max List Size', value: 'Unlimited' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Automatic Protections</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Auto-suppress hard bounces', enabled: true },
                    { label: 'Auto-unsubscribe on complaint', enabled: true },
                    { label: 'Pause sending if bounce rate > 5%', enabled: true },
                    { label: 'Warmup new IP gradually', enabled: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`text-xs font-medium ${item.enabled ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {item.enabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
