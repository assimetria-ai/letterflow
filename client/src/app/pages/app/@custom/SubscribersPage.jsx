// @custom — Subscribers management page for Letterflow
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  Download,
  Upload,
  Mail,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Tag,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
  DataTable,
  FiltersBar,
  BulkActions,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

// Mock data — will be replaced with API calls
const MOCK_SUBSCRIBERS = [
  { id: 1, email: 'alice@example.com', name: 'Alice Johnson', status: 'active', source: 'Landing Page', subscribed: '2026-01-15', openRate: 62.3, tags: ['early-adopter', 'premium'] },
  { id: 2, email: 'bob@startup.io', name: 'Bob Chen', status: 'active', source: 'Import', subscribed: '2026-02-01', openRate: 45.1, tags: ['tech'] },
  { id: 3, email: 'carol@design.co', name: 'Carol Davis', status: 'active', source: 'API', subscribed: '2026-02-10', openRate: 71.8, tags: ['design', 'premium'] },
  { id: 4, email: 'dan@corp.com', name: 'Dan Miller', status: 'unsubscribed', source: 'Landing Page', subscribed: '2026-01-20', openRate: 12.0, tags: [] },
  { id: 5, email: 'eva@freelance.dev', name: 'Eva Park', status: 'active', source: 'Referral', subscribed: '2026-03-01', openRate: 55.9, tags: ['creator'] },
  { id: 6, email: 'frank@news.org', name: 'Frank White', status: 'bounced', source: 'Import', subscribed: '2026-01-05', openRate: 0, tags: [] },
  { id: 7, email: 'grace@agency.com', name: 'Grace Lee', status: 'active', source: 'Landing Page', subscribed: '2026-02-20', openRate: 48.3, tags: ['agency'] },
  { id: 8, email: 'henry@startup.co', name: 'Henry Kim', status: 'active', source: 'API', subscribed: '2026-03-05', openRate: 67.2, tags: ['tech', 'early-adopter'] },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'bounced', label: 'Bounced' },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'Landing Page', label: 'Landing Page' },
  { value: 'Import', label: 'Import' },
  { value: 'API', label: 'API' },
  { value: 'Referral', label: 'Referral' },
]

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-500',
    unsubscribed: 'bg-amber-500/10 text-amber-500',
    bounced: 'bg-red-500/10 text-red-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function SubscribersPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [sortField, setSortField] = useState('subscribed')
  const [sortDir, setSortDir] = useState('desc')

  const filtered = useMemo(() => {
    let result = [...MOCK_SUBSCRIBERS]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s => s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter)
    if (sourceFilter !== 'all') result = result.filter(s => s.source === sourceFilter)
    result.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [search, statusFilter, sourceFilter, sortField, sortDir])

  const activeCount = MOCK_SUBSCRIBERS.filter(s => s.status === 'active').length
  const bouncedCount = MOCK_SUBSCRIBERS.filter(s => s.status === 'bounced').length
  const unsubCount = MOCK_SUBSCRIBERS.filter(s => s.status === 'unsubscribed').length

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <DashboardLayout
      title="Subscribers"
      subtitle={`${MOCK_SUBSCRIBERS.length.toLocaleString()} total subscribers`}
      productColor="#0EA5E9"
      navItems={LETTERFLOW_NAV_ITEMS}
    >
      <DashboardLayout.Content>
        {/* Stats row */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Total Subscribers"
            value={MOCK_SUBSCRIBERS.length.toLocaleString()}
            trend={{ value: 12.4, direction: 'up' }}
            icon={Users}
          />
          <StatCard
            label="Active"
            value={activeCount.toLocaleString()}
            trend={{ value: 8.1, direction: 'up' }}
            icon={UserPlus}
          />
          <StatCard
            label="Unsubscribed"
            value={unsubCount.toLocaleString()}
            trend={{ value: 2.3, direction: 'down' }}
            icon={UserMinus}
          />
          <StatCard
            label="Bounced"
            value={bouncedCount.toLocaleString()}
            description="needs attention"
            icon={Mail}
          />
        </StatCardGrid>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: '200px', maxWidth: '360px' }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#0EA5E9' }}
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm outline-none"
          >
            {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/app/import-export')}>
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" style={{ backgroundColor: '#0EA5E9' }} className="text-white hover:opacity-90">
              <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add Subscriber
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={e => setSelectedIds(e.target.checked ? filtered.map(s => s.id) : [])}
                    className="rounded"
                  />
                </th>
                <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground" onClick={() => toggleSort('name')}>
                  <span className="inline-flex items-center gap-1">Subscriber <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground" onClick={() => toggleSort('openRate')}>
                  <span className="inline-flex items-center gap-1">Open Rate <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tags</th>
                <th className="cursor-pointer px-4 py-3 text-left font-medium text-muted-foreground" onClick={() => toggleSort('subscribed')}>
                  <span className="inline-flex items-center gap-1">Subscribed <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(sub.id)}
                      onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, sub.id] : prev.filter(id => id !== sub.id))}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{sub.source}</td>
                  <td className="px-4 py-3">
                    <span className={sub.openRate > 50 ? 'text-emerald-500 font-medium' : sub.openRate > 25 ? 'text-foreground' : 'text-muted-foreground'}>
                      {sub.openRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {sub.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(sub.subscribed).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded p-1 hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No subscribers found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Showing {filtered.length} of {MOCK_SUBSCRIBERS.length} subscribers</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
