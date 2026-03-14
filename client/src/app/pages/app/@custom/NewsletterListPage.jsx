// @custom — Newsletter list page with status filtering
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Edit,
  Clock,
  Send,
  FileText,
  Calendar,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/@system/Card/Card'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import { newslettersApi } from '../../../lib/@custom/newsletters'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
]

const STATUS_BADGE = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  published: { label: 'Published', className: 'bg-green-100 text-green-700' },
  sent: { label: 'Sent', className: 'bg-purple-100 text-purple-700' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NewsletterListPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [newsletters, setNewsletters] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const loadNewsletters = useCallback(async () => {
    setLoading(true)
    try {
      const data = await newslettersApi.list({ status: status || undefined })
      setNewsletters(data.newsletters || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load newsletters:', err)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadNewsletters()
  }, [loadNewsletters])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return
    try {
      await newslettersApi.remove(id)
      loadNewsletters()
    } catch (err) {
      console.error('Failed to delete newsletter:', err)
    }
  }

  return (
    <DashboardLayout navItems={LETTERFLOW_NAV_ITEMS}>
      <DashboardLayout.Header
        title="Newsletters"
        actions={
          <Button onClick={() => navigate('/app/newsletters/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Newsletter
          </Button>
        }
      />
      <DashboardLayout.Content>
        {/* Status tabs */}
        <div className="flex gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                status === tab.value
                  ? 'bg-sky-500 text-white'
                  : 'bg-background text-foreground border border-border hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Newsletter list */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
        ) : newsletters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No newsletters yet</p>
              <p className="text-muted-foreground/70 text-sm mb-6">Create your first newsletter to get started</p>
              <Button onClick={() => navigate('/app/newsletters/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Newsletter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {newsletters.map((nl) => {
              const badge = STATUS_BADGE[nl.status] || STATUS_BADGE.draft
              return (
                <Card key={nl.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-foreground truncate">{nl.title || 'Untitled'}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Updated {formatDate(nl.updated_at)}
                        </span>
                        {nl.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Scheduled {formatDate(nl.scheduled_at)}
                          </span>
                        )}
                        {nl.published_at && (
                          <span className="flex items-center gap-1">
                            <Send className="w-3.5 h-3.5" />
                            Published {formatDate(nl.published_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/app/newsletters/${nl.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(nl.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
