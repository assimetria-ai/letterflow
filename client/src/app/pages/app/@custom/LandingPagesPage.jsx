// @custom — Landing Pages management for Letterflow
import { useState } from 'react'
import {
  Layout,
  Plus,
  Eye,
  MousePointerClick,
  Globe,
  FileText,
  MoreHorizontal,
  ExternalLink,
  Copy,
  TrendingUp,
  Users,
  CheckCircle,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
} from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

const MOCK_LANDING_PAGES = [
  {
    id: 1,
    name: 'Newsletter Signup — Main',
    slug: 'signup',
    status: 'published',
    views: 12480,
    conversions: 1872,
    conversionRate: 15.0,
    lastUpdated: '2026-03-10',
    thumbnail: null,
  },
  {
    id: 2,
    name: 'Spring Campaign 2026',
    slug: 'spring-2026',
    status: 'published',
    views: 4230,
    conversions: 891,
    conversionRate: 21.1,
    lastUpdated: '2026-03-01',
    thumbnail: null,
  },
  {
    id: 3,
    name: 'Premium Plan Waitlist',
    slug: 'premium-waitlist',
    status: 'draft',
    views: 0,
    conversions: 0,
    conversionRate: 0,
    lastUpdated: '2026-03-12',
    thumbnail: null,
  },
  {
    id: 4,
    name: 'Referral Landing Page',
    slug: 'referral',
    status: 'published',
    views: 2840,
    conversions: 398,
    conversionRate: 14.0,
    lastUpdated: '2026-02-20',
    thumbnail: null,
  },
]

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      status === 'published'
        ? 'bg-emerald-500/10 text-emerald-500'
        : 'bg-amber-500/10 text-amber-500'
    }`}>
      {status === 'published'
        ? <CheckCircle className="h-3 w-3" />
        : <FileText className="h-3 w-3" />
      }
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ConversionBar({ rate }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: '#0EA5E9' }}
        />
      </div>
      <span className="text-sm font-medium" style={{ color: rate > 0 ? '#0EA5E9' : undefined }}>
        {rate > 0 ? `${rate}%` : '—'}
      </span>
    </div>
  )
}

export function LandingPagesPage() {
  const [hoveredId, setHoveredId] = useState(null)

  const publishedPages = MOCK_LANDING_PAGES.filter(p => p.status === 'published')
  const totalViews = MOCK_LANDING_PAGES.reduce((s, p) => s + p.views, 0)
  const totalConversions = MOCK_LANDING_PAGES.reduce((s, p) => s + p.conversions, 0)
  const avgConversionRate = publishedPages.length > 0
    ? (publishedPages.reduce((s, p) => s + p.conversionRate, 0) / publishedPages.length).toFixed(1)
    : '0'

  return (
    <DashboardLayout
      title="Landing Pages"
      subtitle="Grow your subscriber list with dedicated signup pages"
      productColor="#0EA5E9"
      navItems={LETTERFLOW_NAV_ITEMS}
    >
      <DashboardLayout.Content>
        {/* Stats */}
        <StatCardGrid columns={4}>
          <StatCard
            label="Total Pages"
            value={MOCK_LANDING_PAGES.length.toString()}
            description={`${publishedPages.length} published`}
            icon={Layout}
          />
          <StatCard
            label="Total Views"
            value={totalViews.toLocaleString()}
            trend={{ value: 24.3, direction: 'up' }}
            icon={Eye}
          />
          <StatCard
            label="Total Conversions"
            value={totalConversions.toLocaleString()}
            trend={{ value: 18.7, direction: 'up' }}
            icon={Users}
          />
          <StatCard
            label="Avg. Conversion Rate"
            value={`${avgConversionRate}%`}
            trend={{ value: 2.1, direction: 'up' }}
            icon={MousePointerClick}
          />
        </StatCardGrid>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Your Landing Pages</h2>
          <Button
            style={{ backgroundColor: '#0EA5E9' }}
            className="gap-2 text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Landing Page
          </Button>
        </div>

        {/* Pages grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MOCK_LANDING_PAGES.map(page => (
            <div
              key={page.id}
              className="group relative rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden"
              onMouseEnter={() => setHoveredId(page.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Thumbnail placeholder */}
              <div
                className="flex h-32 items-center justify-center border-b"
                style={{ backgroundColor: '#0EA5E910' }}
              >
                <Globe className="h-12 w-12" style={{ color: '#0EA5E940' }} />
                {hoveredId === page.id && page.status === 'published' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/10 backdrop-blur-[2px]">
                    <Button
                      size="sm"
                      style={{ backgroundColor: '#0EA5E9' }}
                      className="text-white gap-1.5 hover:opacity-90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{page.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      /{page.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusBadge status={page.status} />
                    <button className="rounded p-1 hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Views
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {page.views > 0 ? page.views.toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Conversions
                    </p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {page.conversions > 0 ? page.conversions.toLocaleString() : '—'}
                    </p>
                  </div>
                </div>

                {/* Conversion rate bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Conversion rate</span>
                  </div>
                  <ConversionBar rate={page.conversionRate} />
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(page.lastUpdated).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    {page.status === 'published' && (
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <Copy className="h-3 w-3" /> Copy URL
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance summary */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Top Performer</h3>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          {publishedPages.length > 0 && (() => {
            const top = [...publishedPages].sort((a, b) => b.conversionRate - a.conversionRate)[0]
            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{top.name}</p>
                  <p className="text-sm text-muted-foreground">/{top.slug} · {top.views.toLocaleString()} views</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: '#0EA5E9' }}>{top.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">conversion rate</p>
                </div>
              </div>
            )
          })()}
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
