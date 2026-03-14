// @custom — Automations page for Letterflow email sequences
import { useState } from 'react'
import {
  Zap,
  Plus,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Mail,
  Clock,
  GitBranch,
  Users,
  Tag,
  Calendar,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ArrowRight,
  Circle,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

// Mock automations data
const MOCK_AUTOMATIONS = [
  {
    id: 1,
    name: 'Welcome Series',
    trigger: { type: 'signup', label: 'New Subscriber Signup' },
    status: 'active',
    enrolled: 1243,
    completed: 987,
    active: 256,
    steps: [
      { id: 's1', type: 'email', label: 'Welcome Email', description: 'Send welcome message immediately', delay: null },
      { id: 's2', type: 'wait', label: 'Wait 2 days', description: 'Wait before next email', delay: '2 days' },
      { id: 's3', type: 'email', label: 'Getting Started Guide', description: 'Send onboarding tips', delay: null },
      { id: 's4', type: 'wait', label: 'Wait 5 days', description: 'Wait before final email', delay: '5 days' },
      { id: 's5', type: 'condition', label: 'Opened Previous Email?', description: 'Branch based on open behavior', delay: null },
      { id: 's6', type: 'email', label: 'Engagement Boost', description: 'Send re-engagement offer (not opened)', delay: null },
    ],
  },
  {
    id: 2,
    name: 'Premium Upsell Sequence',
    trigger: { type: 'tag', label: 'Tag Added: free-plan' },
    status: 'active',
    enrolled: 421,
    completed: 198,
    active: 223,
    steps: [
      { id: 's1', type: 'wait', label: 'Wait 3 days', description: 'Let user explore first', delay: '3 days' },
      { id: 's2', type: 'email', label: 'Feature Spotlight', description: 'Highlight premium features', delay: null },
      { id: 's3', type: 'wait', label: 'Wait 7 days', description: 'Give time to consider', delay: '7 days' },
      { id: 's4', type: 'condition', label: 'Clicked Upgrade Link?', description: 'Check if user expressed interest', delay: null },
      { id: 's5', type: 'email', label: 'Limited Time Offer', description: 'Send 20% discount code (not upgraded)', delay: null },
    ],
  },
  {
    id: 3,
    name: 'Birthday Campaign',
    trigger: { type: 'date', label: 'Subscriber Birthday (Custom Field)' },
    status: 'paused',
    enrolled: 89,
    completed: 67,
    active: 22,
    steps: [
      { id: 's1', type: 'email', label: 'Happy Birthday!', description: 'Send personalized birthday email', delay: null },
      { id: 's2', type: 'wait', label: 'Wait 1 day', description: 'Follow-up timing', delay: '1 day' },
      { id: 's3', type: 'email', label: 'Birthday Gift Reminder', description: 'Remind about birthday offer', delay: null },
    ],
  },
  {
    id: 4,
    name: 'Re-engagement Flow',
    trigger: { type: 'tag', label: 'Tag Added: inactive-90d' },
    status: 'active',
    enrolled: 312,
    completed: 201,
    active: 111,
    steps: [
      { id: 's1', type: 'email', label: 'We Miss You', description: 'Send re-engagement email', delay: null },
      { id: 's2', type: 'wait', label: 'Wait 7 days', description: 'Monitor engagement', delay: '7 days' },
      { id: 's3', type: 'condition', label: 'Opened Re-engagement Email?', description: 'Check if subscriber is still interested', delay: null },
      { id: 's4', type: 'email', label: 'Last Chance — Stay or Go', description: 'Final email before unsubscribing (not opened)', delay: null },
    ],
  },
]

const TRIGGER_ICONS = {
  signup: Users,
  tag: Tag,
  date: Calendar,
}

const STEP_ICONS = {
  email: Mail,
  wait: Clock,
  condition: GitBranch,
}

const STEP_COLORS = {
  email: '#0EA5E9',
  wait: '#8B5CF6',
  condition: '#F59E0B',
}

function TriggerBadge({ trigger }) {
  const Icon = TRIGGER_ICONS[trigger.type] ?? Zap
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-500">
      <Icon className="h-3 w-3" />
      {trigger.label}
    </span>
  )
}

function StepNode({ step, isLast }) {
  const Icon = STEP_ICONS[step.type] ?? Circle
  const color = STEP_COLORS[step.type] ?? '#6B7280'

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        {!isLast && <div className="mt-1 h-8 w-px bg-border" />}
      </div>
      <div className="pb-2 pt-1">
        <p className="text-sm font-medium text-foreground">{step.label}</p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
        {step.delay && (
          <span className="mt-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <Clock className="h-2.5 w-2.5" /> {step.delay}
          </span>
        )}
      </div>
    </div>
  )
}

function AutomationCard({ automation, isExpanded, onToggle }) {
  const completionRate = automation.enrolled > 0
    ? Math.round((automation.completed / automation.enrolled) * 100)
    : 0

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 px-4 py-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {isExpanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          }
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{automation.name}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                automation.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                {automation.status === 'active'
                  ? <><Play className="mr-1 h-2.5 w-2.5" />Active</>
                  : <><Pause className="mr-1 h-2.5 w-2.5" />Paused</>
                }
              </span>
            </div>
            <div className="mt-1">
              <TriggerBadge trigger={automation.trigger} />
            </div>
          </div>
        </button>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 text-center flex-shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">Enrolled</p>
            <p className="font-semibold text-foreground">{automation.enrolled.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="font-semibold" style={{ color: '#0EA5E9' }}>{automation.active.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="font-semibold text-emerald-500">{automation.completed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="font-semibold text-foreground">{completionRate}%</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
          <button className="rounded p-1.5 hover:bg-muted">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Completion progress bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{completionRate}% complete</span>
        </div>
      </div>

      {/* Expanded step view */}
      {isExpanded && (
        <div className="border-t bg-muted/30 px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sequence Steps ({automation.steps.length})
            </h4>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Step
            </Button>
          </div>

          {/* Trigger node */}
          <div className="flex items-start gap-3 mb-0">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background flex-shrink-0">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 h-8 w-px bg-border" />
            </div>
            <div className="pt-1">
              <p className="text-sm font-medium text-foreground">Trigger: {automation.trigger.label}</p>
              <p className="text-xs text-muted-foreground">Automation starts when this event occurs</p>
            </div>
          </div>

          {/* Steps */}
          {automation.steps.map((step, index) => (
            <StepNode
              key={step.id}
              step={step}
              isLast={index === automation.steps.length - 1}
            />
          ))}

          {/* End node */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground italic">End of sequence</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function AutomationsPage() {
  const [expandedIds, setExpandedIds] = useState([1])

  const totalEnrolled = MOCK_AUTOMATIONS.reduce((s, a) => s + a.enrolled, 0)
  const totalActive = MOCK_AUTOMATIONS.reduce((s, a) => s + a.active, 0)
  const totalCompleted = MOCK_AUTOMATIONS.reduce((s, a) => s + a.completed, 0)
  const activeAutomations = MOCK_AUTOMATIONS.filter(a => a.status === 'active').length

  const toggleExpanded = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <DashboardLayout
      title="Automations"
      subtitle="Build subscriber journeys that run on autopilot"
      productColor="#0EA5E9"
      navItems={LETTERFLOW_NAV_ITEMS}
    >
      <DashboardLayout.Content>
        {/* Stats */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Active Automations"
            value={activeAutomations.toString()}
            description={`of ${MOCK_AUTOMATIONS.length} total`}
            trend={{ value: 33, direction: 'up' }}
            icon={Zap}
          />
          <StatCard
            label="Enrolled (All Time)"
            value={totalEnrolled.toLocaleString()}
            trend={{ value: 18.2, direction: 'up' }}
            icon={Users}
          />
          <StatCard
            label="Currently Active"
            value={totalActive.toLocaleString()}
            description="in a sequence now"
            icon={Play}
          />
          <StatCard
            label="Completed"
            value={totalCompleted.toLocaleString()}
            trend={{ value: 22.4, direction: 'up' }}
            icon={CheckCircle}
          />
        </StatCardGrid>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Your Automations</h2>
            <p className="text-sm text-muted-foreground">Click an automation to view its step sequence</p>
          </div>
          <Button
            style={{ backgroundColor: '#0EA5E9' }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Automation
          </Button>
        </div>

        {/* Trigger type legend */}
        <div className="flex flex-wrap gap-3">
          {[
            { type: 'signup', label: 'Signup Trigger', Icon: Users },
            { type: 'tag', label: 'Tag Trigger', Icon: Tag },
            { type: 'date', label: 'Date Trigger', Icon: Calendar },
          ].map(({ type, label, Icon }) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-sky-500" />
              {label}
            </div>
          ))}
          <div className="ml-auto flex items-center gap-3 text-xs">
            {Object.entries(STEP_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground capitalize">{type} step</span>
              </div>
            ))}
          </div>
        </div>

        {/* Automation list */}
        <div className="space-y-3">
          {MOCK_AUTOMATIONS.map(automation => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              isExpanded={expandedIds.includes(automation.id)}
              onToggle={() => toggleExpanded(automation.id)}
            />
          ))}
        </div>

        {/* Suggested templates */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Start from a Template</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[
              { name: 'Product Onboarding', steps: 5, trigger: 'Signup' },
              { name: 'Abandoned Cart Recovery', steps: 3, trigger: 'Tag: cart-abandoned' },
              { name: 'Anniversary Reward', steps: 2, trigger: 'Date: 1 year subscribed' },
            ].map(t => (
              <button
                key={t.name}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3 text-left hover:bg-muted/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.steps} steps · {t.trigger}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
