// @custom — Import/Export page for subscriber management
import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Download,
  FileText,
  History,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/@system/Card/Card'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import { subscribersApi } from '../../../lib/@custom/subscribers'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'

const TABS = [
  { id: 'import', label: 'Import Subscribers', icon: Upload },
  { id: 'export', label: 'Export Data', icon: Download },
  { id: 'history', label: 'Import History', icon: History },
]

export function ImportExportPage() {
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState('import')

  return (
    <DashboardLayout navItems={LETTERFLOW_NAV_ITEMS}>
      <DashboardLayout.Header title="Import / Export" />
      <DashboardLayout.Content>
        {/* Tab bar */}
        <div className="border-b border-border mb-6">
          <nav className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-500 text-sky-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'import' && <ImportTab />}
        {activeTab === 'export' && <ExportTab />}
        {activeTab === 'history' && <HistoryTab />}
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}

// ── Import Tab ───────────────────────────────────────────────────────────────

function ImportTab() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fieldMapping, setFieldMapping] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const resetState = () => {
    setFile(null)
    setPreview(null)
    setFieldMapping(null)
    setResult(null)
    setError(null)
    setProgress(0)
  }

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }
    setFile(selectedFile)
    setError(null)
    setResult(null)
    setProgress(0)
    try {
      const data = await subscribersApi.preview(selectedFile)
      setPreview(data)
      setFieldMapping(data.fieldMapping)
    } catch (err) {
      setError(err.message)
      setPreview(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFileSelect(droppedFile)
    },
    [handleFileSelect],
  )

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    setProgress(10)
    try {
      setProgress(30)
      const data = await subscribersApi.import(file, fieldMapping)
      setResult(data)
      setProgress(100)
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const updateMapping = (field, value) => {
    setFieldMapping((prev) => ({ ...prev, [field]: value || undefined }))
  }

  const sourceLabel = {
    csv: 'Generic CSV',
    mailchimp: 'Mailchimp Export',
    substack: 'Substack Export',
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!preview && !result && (
        <Card>
          <CardContent className="p-0">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-sky-400 bg-sky-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-700">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports CSV exports from Mailchimp, Substack, and other platforms. Max file size: 10MB.
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
                <span>Mailchimp</span>
                <span>·</span>
                <span>Substack</span>
                <span>·</span>
                <span>Generic CSV</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{preview.filename}</CardTitle>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-sky-100 text-sky-700">
                    {sourceLabel[preview.source] || 'CSV'}
                  </span>
                </div>
                <button onClick={resetState} className="text-sm text-gray-500 hover:text-gray-700">
                  Change file
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total Rows" value={preview.totalRows} />
                <Stat label="Valid Emails" value={preview.validEmails} color="green" />
                <Stat label="Invalid" value={preview.invalidEmails} color="red" />
                <Stat label="File Duplicates" value={preview.internalDuplicates} color="yellow" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <p className="text-sm text-gray-500">We auto-detected column mappings. Adjust if needed.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['email', 'name', 'status', 'tags'].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 w-20 capitalize">
                      {field}
                      {field === 'email' && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={fieldMapping?.[field] || ''}
                      onChange={(e) => updateMapping(field, e.target.value)}
                      className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Not mapped --</option>
                      {preview.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {preview.sampleRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview (first {preview.sampleRows.length} rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600">Email</th>
                        <th className="px-3 py-2 text-left text-gray-600">Name</th>
                        <th className="px-3 py-2 text-left text-gray-600">Status</th>
                        <th className="px-3 py-2 text-left text-gray-600">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.sampleRows.map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-xs">{row.email}</td>
                          <td className="px-3 py-2">{row.name || '-'}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-3 py-2 text-xs">{row.tags?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {importing && (
            <Card>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Importing...</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={importing || !fieldMapping?.email}>
              {importing ? 'Importing...' : `Import ${preview.validEmails} Subscribers`}
            </Button>
            <Button variant="outline" onClick={resetState}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* Import Result */}
      {result && (
        <div className="space-y-4">
          <Card
            className={
              result.summary.errors > 0
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-green-200 bg-green-50'
            }
          >
            <CardHeader>
              <CardTitle
                className={result.summary.errors > 0 ? 'text-yellow-800' : 'text-green-800'}
              >
                {result.summary.errors > 0 ? 'Import Completed with Warnings' : 'Import Successful'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Stat label="Total Rows" value={result.summary.total} />
                <Stat label="Imported" value={result.summary.imported} color="green" />
                <Stat label="Duplicates Skipped" value={result.summary.duplicates} color="yellow" />
                <Stat label="Errors" value={result.summary.errors} color="red" />
              </div>

              {result.errors?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2">Error Details</h4>
                  <div className="max-h-48 overflow-y-auto border border-red-200 rounded bg-white">
                    <table className="min-w-full text-xs">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="px-3 py-1.5 text-left text-red-700">Line</th>
                          <th className="px-3 py-1.5 text-left text-red-700">Email</th>
                          <th className="px-3 py-1.5 text-left text-red-700">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {result.errors.map((err, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-gray-600">{err.line || '-'}</td>
                            <td className="px-3 py-1.5 text-gray-600 font-mono">{err.email || '-'}</td>
                            <td className="px-3 py-1.5 text-red-600">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={resetState}>Import More</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Export Tab ───────────────────────────────────────────────────────────────

function ExportTab() {
  const [exporting, setExporting] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    subscribersApi
      .getStats()
      .then((data) => data && setStats(data))
      .catch(() => {})
  }, [])

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async (type, filters = {}) => {
    setExporting(type)
    try {
      if (type === 'campaigns') {
        const blob = await subscribersApi.exportCampaigns()
        triggerDownload(blob, `campaigns_export_${new Date().toISOString().slice(0, 10)}.csv`)
      } else {
        const blob = await subscribersApi.exportSubscribers(filters)
        triggerDownload(blob, `subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`)
      }
    } catch {
      // Silent fail
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Stat label="Total" value={stats.total} />
              <Stat label="Active" value={stats.active} color="green" />
              <Stat label="Unsubscribed" value={stats.unsubscribed} color="yellow" />
              <Stat label="Bounced" value={stats.bounced} color="red" />
              <Stat label="Pending" value={stats.pending} color="gray" />
            </div>
          </CardContent>
        </Card>
      )}

      <ExportCard
        title="All Subscribers"
        description="Export your complete subscriber list with email, name, status, tags, custom fields, and dates."
        loading={exporting === 'all'}
        onExport={() => handleExport('all')}
      />
      <ExportCard
        title="Active Subscribers Only"
        description="Export only subscribers with active status."
        loading={exporting === 'active'}
        onExport={() => handleExport('active', { status: 'active' })}
      />
      <ExportCard
        title="Unsubscribed"
        description="Export subscribers who have unsubscribed."
        loading={exporting === 'unsubscribed'}
        onExport={() => handleExport('unsubscribed', { status: 'unsubscribed' })}
      />
      <ExportCard
        title="Campaign Data"
        description="Export all newsletter campaigns with performance metrics (open rate, click rate, send count)."
        loading={exporting === 'campaigns'}
        onExport={() => handleExport('campaigns')}
      />
    </div>
  )
}

function ExportCard({ title, description, loading, onExport }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <Button onClick={onExport} disabled={loading} className="ml-4 whitespace-nowrap">
          <Download className="w-4 h-4 mr-2" />
          {loading ? 'Exporting...' : 'Download CSV'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    subscribersApi
      .getHistory()
      .then((data) => setJobs(data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading import history...
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <History className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-1">No import history yet</p>
          <p className="text-gray-400 text-sm">Import your first CSV to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">File</th>
                <th className="px-4 py-3 text-left text-gray-600">Source</th>
                <th className="px-4 py-3 text-left text-gray-600">Status</th>
                <th className="px-4 py-3 text-right text-gray-600">Imported</th>
                <th className="px-4 py-3 text-right text-gray-600">Duplicates</th>
                <th className="px-4 py-3 text-right text-gray-600">Errors</th>
                <th className="px-4 py-3 text-left text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-4 py-3 font-medium">{job.filename || '-'}</td>
                  <td className="px-4 py-3 capitalize">{job.source}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{job.imported}</td>
                  <td className="px-4 py-3 text-right text-yellow-600">{job.duplicates}</td>
                  <td className="px-4 py-3 text-right text-red-500">{job.errors}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Shared Components ────────────────────────────────────────────────────────

function Stat({ label, value, color }) {
  const colors = {
    green: 'text-green-600',
    red: 'text-red-500',
    yellow: 'text-yellow-600',
    gray: 'text-gray-500',
  }
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${colors[color] || 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    unsubscribed: 'bg-yellow-100 text-yellow-700',
    bounced: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-sky-100 text-sky-700',
    failed: 'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  )
}
