// @custom — A/B Testing page for Letterflow email campaigns
import { useState } from 'react'
import {
  FlaskConical,
  Plus,
  Trophy,
  Play,
  Pause,
  CheckCircle,
  Clock,
  BarChart2,
  Mail,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  MousePointerClick,
  AlertCircle,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TESTS = [
  {
    id: 1,
    name: 'Subject Line: Emoji vs Plain Text',
    campaign: 'March Product Update',
    status: 'running',
    startDate: '2026-03-10',
    endDate: null,
    metric: 'open_rate',
    sampleSize: 2400,
    variants: [
      {
        id: 'a',
        label: 'Variant A',
        subject: '🚀 Your March product update is here',
        sent: 1200,
        opens: 528,
        clicks: 144,
        openRate: 44.0,
        clickRate: 12.0,
        isWinner: false,
      },
      {
        id: 'b',
        label: 'Variant B',
        subject: 'March product update — what\'s new for you',
        sent: 1200,
        opens: 468,
        clicks: 156,
        openRate: 39.0,
        clickRate: 13.0,
        isWinner: false,
      },
    ],
    confidence: 74,
    notes: 'Running until 95% confidence or March 17.',
  },
  {
    id: 2,
    name: 'Send Time: Morning vs Evening',
    campaign: 'Weekly Digest #12',
    status: 'completed',
    startDate: '2026-03-01',
    endDate: '2026-03-05',
    metric: 'click_rate',
    sampleSize: 3000,
    variants: [
      {
        id: 'a',
        label: 'Variant A',
        subject: 'Weekly Digest — sent 9 AM',
        sent: 1500,
        opens: 615,
        clicks: 198,
        openRate: 41.0,
        clickRate: 13.2,
        isWinner: false,
      },
      {
        id: 'b',
        label: 'Variant B',
        subject: 'Weekly Digest — sent 6 PM',
        sent: 1500,
        opens: 690,
        clicks: 248,
        openRate: 46.0,
        clickRate: 16.5,
        isWinner: true,
      },
    ],
    confidence: 98,
    notes: 'Evening send wins decisively. Applying to future digests.',
  },
  {
    id: 3,
    name: 'CTA Button Color: Blue vs Green',
    campaign: 'Upgrade Upsell Flow',
    status: 'completed',
    startDate: '2026-02-20',
    endDate: '2026-02-28',
    metric: 'click_rate',
    sampleSize: 1800,
    variants: [
      {
        id: 'a',
        label: 'Variant A',
        subject: 'Upgrade your plan — CTA: Blue',
        sent: 900,
        opens: 369,
        clicks: 63,
        openRate: 41.0,
        clickRate: 7.0,
        isWinner: false,
      },
      {
        id: 'b',
        label: 'Variant B',
        subject: 'Upgrade your plan — CTA: Green',
        sent: 900,
        opens: 378,
        clicks: 81,
        openRate: 42.0,
        clickRate: 9.0,
        isWinner: true,
      },
    ],
    confidence: 96,
    notes: 'Green CTA achieves 28.6% relative uplift in clicks.',
  },
  {
    id: 4,
    name: 'Personalization: First Name vs Generic',
    campaign: 'Re-engagement Campaign',
    status: 'draft',
    startDate: null,
    endDate: null,
    metric: 'open_rate',
    sampleSize: 2000,
    variants: [
      {
        id: 'a',
        label: 'Variant A',
        subject: 'Hey {{first_name}}, we miss you!',
        sent: 0,
        opens: 0,
        clicks: 0,
        openRate: 0,
        clickRate: 0,
        isWinner: false,
      },
      {
        id: 'b',
        label: 'Variant B',
        subject: 'We\'ve been thinking about you',
        sent: 0,
        opens: 0,
        clicks: 0,
        openRate: 0,
        clickRate: 0,
        isWinner: false,
      },
    ],
    confidence: null,
    notes: 'Scheduled for March 18 launch.',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  running: { label: 'Running', color: 'text-sky-500', bg: 'bg-sky-500/10', Icon: Play },
  completed: { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10', Icon: CheckCircle },
  draft: { label: 'Draft', color: 'text-amber-500', bg: 'bg-amber-500/10', Icon: Clock },
}

const METRIC_LABELS = {
  open_rate: 'Open Rate',
  click_rate: 'Click Rate',
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  const { Icon, label, color, bg } = cfg
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function ConfidenceBar({ confidence }) {
  if (confidence === null) return <span className="text-xs text-muted-foreground">—</span>
  const color = confidence >= 95 ? 'bg-emerald-500' : confidence >= 80 ? 'bg-amber-500' : 'bg-sky-400'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${confidence}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground">{confidence}%</span>
    </div>
  )
}

function VariantRow({ variant, metric, isLeader }) {
  const value = metric === 'open_rate' ? variant.openRate : variant.clickRate
  return (
    <div className={`flex items-center gap-4 rounded-md px-3 py-2.5 ${isLeader ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'bg-muted/30'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">{variant.label}</span>
          {variant.isWinner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
              <Trophy className="h-2.5 w-2.5" /> Winner
            </span>
          )}
          {isLeader && !variant.isWinner && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-500">
              Leading
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{variant.subject}</p>
      </div>
      <div className="flex items-center gap-5 text-right flex-shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground">Sent</p>
          <p className="text-sm font-medium text-foreground">{variant.sent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Opens</p>
          <p className="text-sm font-medium text-foreground">{variant.openRate > 0 ? `${variant.openRate}%` : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Clicks</p>
          <p className="text-sm font-medium text-foreground">{variant.clickRate > 0 ? `${variant.clickRate}%` : '—'}</p>
        </div>
        <div className="w-16">
          <p className="text-[10px] text-muted-foreground">{METRIC_LABELS[metric]}</p>
          <p className={`text-sm font-semibold ${value > 0 ? 'text-sky-500' : 'text-muted-foreground'}`}>
            {value > 0 ? `${value}%` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

function ABTestCard({ test }) {
  const [expanded, setExpanded] = useState(test.status === 'running')

  const leadingVariant = test.variants.reduce(
    (best, v) => {
      const val = test.metric === 'open_rate' ? v.openRate : v.clickRate
      const bestVal = test.metric === 'open_rate' ? best.openRate : best.clickRate
      return val > bestVal ? v : best
    },
    test.variants[0]
  )

  const winner = test.variants.find(v => v.isWinner)

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        {expanded
          ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{test.name}</span>
            <StatusBadge status={test.status} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Campaign: {test.campaign} · Metric: {METRIC_LABELS[test.metric]} · {test.sampleSize.toLocaleString()} subscribers
          </p>
        </div>

        <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">Confidence</p>
            <ConfidenceBar confidence={test.confidence} />
          </div>
          {winner && (
            <div className="flex items-center gap-1.5 text-emerald-500">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">{winner.label} wins</span>
            </div>
          )}
          {test.status === 'running' && !winner && (
            <div className="flex items-center gap-1.5 text-sky-500">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">{leadingVariant.label} leading</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t bg-muted/20 px-5 py-4 space-y-3">
          {/* Variants */}
          <div className="space-y-2">
            {test.variants.map(variant => {
              const variantValue = test.metric === 'open_rate' ? variant.openRate : variant.clickRate
              const leaderValue = test.metric === 'open_rate' ? leadingVariant.openRate : leadingVariant.clickRate
              return (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  metric={test.metric}
                  isLeader={variantValue === leaderValue && variantValue > 0}
                />
              )
            })}
          </div>

          {/* Confidence & Notes */}
          <div className="flex items-start justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              {test.confidence !== null && (
                <span className={`text-xs ${test.confidence >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {test.confidence >= 95
                    ? '✓ Statistically significant result'
                    : `${test.confidence}% confidence — still collecting data`}
                </span>
              )}
            </div>
            {test.notes && (
              <p className="text-xs text-muted-foreground italic text-right max-w-xs">{test.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t">
            {test.status === 'running' && (
              <>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Trophy className="h-3 w-3" /> Pick Winner
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700">
                  <Pause className="h-3 w-3" /> Pause Test
                </Button>
              </>
            )}
            {test.status === 'draft' && (
              <Button size="sm" className="h-7 text-xs gap-1 bg-sky-500 hover:bg-sky-600 text-white">
                <Play className="h-3 w-3" /> Launch Test
              </Button>
            )}
            {test.status === 'completed' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <BarChart2 className="h-3 w-3" /> Full Report
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto">
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create Test Modal ────────────────────────────────────────────────────────

function CreateTestModal({ onClose }) {
  const [form, setForm] = useState({
    name: '',
    campaign: '',
    metric: 'open_rate',
    variantA: '',
    variantB: '',
    sampleSize: '2000',
  })

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl border bg-background shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-sky-500" />
            <h2 className="text-base font-semibold text-foreground">Create A/B Test</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Test Name</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Subject Line: Curiosity vs. Directness"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Campaign</label>
            <input
              type="text"
              value={form.campaign}
              onChange={set('campaign')}
              placeholder="Select or type a campaign name"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Winning Metric</label>
              <select
                value={form.metric}
                onChange={set('metric')}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="open_rate">Open Rate</option>
                <option value="click_rate">Click Rate</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Sample Size</label>
              <input
                type="number"
                value={form.sampleSize}
                onChange={set('sampleSize')}
                min="200"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-foreground">Subject Lines</label>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-600 flex-shrink-0">A</span>
              <input
                type="text"
                value={form.variantA}
                onChange={set('variantA')}
                placeholder="Variant A subject line"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-600 flex-shrink-0">B</span>
              <input
                type="text"
                value={form.variantB}
                onChange={set('variantB')}
                placeholder="Variant B subject line"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>Each variant will be sent to {Math.round(Number(form.sampleSize) / 2).toLocaleString()} subscribers. The winner will be sent to the remaining list.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="gap-1.5 bg-sky-500 hover:bg-sky-600 text-white"
            disabled={!form.name || !form.variantA || !form.variantB}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Save as Draft
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ABTestPage() {
  const [tests] = useState(MOCK_TESTS)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')

  const running = tests.filter(t => t.status === 'running')
  const completed = tests.filter(t => t.status === 'completed')
  const drafts = tests.filter(t => t.status === 'draft')

  const avgConfidence = completed.length > 0
    ? Math.round(completed.reduce((s, t) => s + (t.confidence ?? 0), 0) / completed.length)
    : 0

  const filteredTests = filter === 'all' ? tests : tests.filter(t => t.status === filter)

  return (
    <DashboardLayout
      title="A/B Testing"
      subtitle="Optimize email performance with controlled experiments"
      productColor="#0EA5E9"
      navItems={LETTERFLOW_NAV_ITEMS}
    >
      <DashboardLayout.Content>
        {/* Stats */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Running Tests"
            value={running.length.toString()}
            description="currently active"
            icon={FlaskConical}
          />
          <StatCard
            label="Completed Tests"
            value={completed.length.toString()}
            trend={{ value: 50, direction: 'up' }}
            icon={CheckCircle}
          />
          <StatCard
            label="Avg. Confidence"
            value={`${avgConfidence}%`}
            description="across completed tests"
            icon={BarChart2}
          />
          <StatCard
            label="Subscribers Tested"
            value={tests.reduce((s, t) => s + t.sampleSize, 0).toLocaleString()}
            description="total across all tests"
            icon={Users}
          />
        </StatCardGrid>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'running', label: 'Running' },
              { key: 'completed', label: 'Completed' },
              { key: 'draft', label: 'Drafts' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
                {key !== 'all' && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                    {tests.filter(t => t.status === key).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus className="h-4 w-4" />
            New A/B Test
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Open Rate</div>
          <div className="flex items-center gap-1.5"><MousePointerClick className="h-3.5 w-3.5" /> Click Rate</div>
          <div className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-emerald-500" /> Winner declared</div>
          <div className="ml-auto flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /> 95%+ confidence = significant</div>
        </div>

        {/* Test List */}
        <div className="space-y-3">
          {filteredTests.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/10 py-12 text-center">
              <FlaskConical className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No tests in this category</p>
              <p className="mt-1 text-xs text-muted-foreground">Create a new A/B test to get started</p>
            </div>
          ) : (
            filteredTests.map(test => <ABTestCard key={test.id} test={test} />)
          )}
        </div>

        {/* Insights Panel */}
        {completed.length > 0 && (filter === 'all' || filter === 'completed') && (
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-semibold text-foreground">Insights from Completed Tests</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {completed.map(test => {
                const w = test.variants.find(v => v.isWinner)
                if (!w) return null
                const loser = test.variants.find(v => !v.isWinner)
                const winVal = test.metric === 'open_rate' ? w.openRate : w.clickRate
                const loseVal = test.metric === 'open_rate' ? loser.openRate : loser.clickRate
                const uplift = loseVal > 0 ? Math.round(((winVal - loseVal) / loseVal) * 100) : 0
                return (
                  <div key={test.id} className="rounded-md bg-emerald-500/5 p-3 ring-1 ring-emerald-500/15">
                    <div className="flex items-start gap-2">
                      <Trophy className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{test.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{w.label}: {winVal}% {METRIC_LABELS[test.metric]}</p>
                        {uplift > 0 && (
                          <p className="mt-1 text-[11px] font-medium text-emerald-600">+{uplift}% uplift vs. {loser.label}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DashboardLayout.Content>

      {showCreate && <CreateTestModal onClose={() => setShowCreate(false)} />}
    </DashboardLayout>
  )
}
