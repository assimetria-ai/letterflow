// @custom — Subscriber CSV import page for Letterflow
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  X,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'

// Mock CSV headers and sample rows returned after "parsing"
const MOCK_PARSE_RESULT = {
  filename: 'subscribers.csv',
  totalRows: 247,
  validEmails: 241,
  invalidEmails: 3,
  internalDuplicates: 3,
  headers: ['Email Address', 'First Name', 'Last Name', 'Status', 'Tags', 'Joined'],
  sampleRows: [
    { email: 'jane@example.com', name: 'Jane Smith', status: 'active', tags: ['newsletter', 'premium'] },
    { email: 'mark@startup.io', name: 'Mark Evans', status: 'active', tags: ['tech'] },
    { email: 'sara@design.co', name: 'Sara Cruz', status: 'active', tags: ['design'] },
    { email: 'tom@corp.com', name: 'Tom Hill', status: 'unsubscribed', tags: [] },
    { email: 'nora@agency.dev', name: 'Nora Pham', status: 'active', tags: ['agency', 'premium'] },
  ],
  autoMapping: {
    email: 'Email Address',
    name: 'First Name',
    status: 'Status',
    tags: 'Tags',
  },
}

const STEPS = [
  { id: 'upload', label: 'Upload File' },
  { id: 'map', label: 'Map Fields' },
  { id: 'preview', label: 'Preview' },
  { id: 'done', label: 'Complete' },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const idx = STEPS.findIndex(s => s.id === current)
        const done = i < idx
        const active = i === idx
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                    ? 'text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
                style={active ? { backgroundColor: '#0EA5E9' } : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 mb-5 h-px w-16 transition-colors ${done ? 'bg-emerald-500' : 'bg-border'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-500',
    unsubscribed: 'bg-amber-500/10 text-amber-500',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  )
}

// ── Step 1: Upload ────────────────────────────────────────────────────────────

function UploadStep({ onNext }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Upload your CSV file</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Supports exports from Mailchimp, Substack, ConvertKit, and any generic CSV. Max 10 MB.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-14 text-center transition-colors ${
          dragOver
            ? 'border-sky-400 bg-sky-50'
            : file
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-border hover:border-muted-foreground/50'
        }`}
        style={dragOver ? { borderColor: '#0EA5E9', backgroundColor: '#0EA5E920' } : undefined}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <FileText className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · Click to change
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: '#0EA5E920' }}
            >
              <Upload className="h-7 w-7" style={{ color: '#0EA5E9' }} />
            </div>
            <div>
              <p className="font-medium text-foreground">Drop your CSV here, or click to browse</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Supports .csv files from Mailchimp, Substack, ConvertKit, and more
              </p>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Mailchimp</span>
              <span>·</span>
              <span>Substack</span>
              <span>·</span>
              <span>ConvertKit</span>
              <span>·</span>
              <span>Generic CSV</span>
            </div>
          </>
        )}
      </div>

      {/* Format hints */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-medium text-foreground">Required columns</p>
        <div className="flex flex-wrap gap-2">
          {['Email Address (required)', 'Name', 'Status', 'Tags'].map(col => (
            <span key={col} className="rounded bg-background px-2 py-1 text-xs text-muted-foreground shadow-sm">
              {col}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => file && onNext(file)}
          disabled={!file}
          style={file ? { backgroundColor: '#0EA5E9' } : undefined}
          className={file ? 'text-white hover:opacity-90' : ''}
        >
          Continue <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Map Fields ────────────────────────────────────────────────────────

function MapStep({ parseResult, onNext, onBack }) {
  const [mapping, setMapping] = useState(parseResult.autoMapping)

  const FIELDS = [
    { key: 'email', label: 'Email', required: true },
    { key: 'name', label: 'Name', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'tags', label: 'Tags', required: false },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Map your columns</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We auto-detected the columns below. Adjust if needed.
        </p>
      </div>

      {/* Parse summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total rows', value: parseResult.totalRows },
          { label: 'Valid emails', value: parseResult.validEmails, color: 'text-emerald-500' },
          { label: 'Invalid', value: parseResult.invalidEmails, color: 'text-red-500' },
          { label: 'Duplicates', value: parseResult.internalDuplicates, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 text-center shadow-sm">
            <p className={`text-xl font-bold ${s.color || 'text-foreground'}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Field mapping */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium text-foreground">Field mapping</p>
        </div>
        <div className="divide-y">
          {FIELDS.map(field => (
            <div key={field.key} className="flex items-center gap-4 px-4 py-3">
              <div className="w-24 shrink-0">
                <span className="text-sm font-medium text-foreground">{field.label}</span>
                {field.required && <span className="ml-0.5 text-red-500">*</span>}
              </div>
              <div className="text-muted-foreground">→</div>
              <select
                value={mapping[field.key] || ''}
                onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#0EA5E9' }}
              >
                <option value="">-- Not mapped --</option>
                {parseResult.headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {mapping[field.key] ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : field.required ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              ) : (
                <div className="h-4 w-4 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={() => onNext(mapping)}
          disabled={!mapping.email}
          style={mapping.email ? { backgroundColor: '#0EA5E9' } : undefined}
          className={mapping.email ? 'text-white hover:opacity-90' : ''}
        >
          Preview <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3: Preview ───────────────────────────────────────────────────────────

function PreviewStep({ parseResult, onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Preview import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Showing the first {parseResult.sampleRows.length} rows. Review before confirming.
        </p>
      </div>

      {/* File info banner */}
      <div
        className="flex items-center gap-3 rounded-lg border px-4 py-3"
        style={{ borderColor: '#0EA5E960', backgroundColor: '#0EA5E910' }}
      >
        <FileText className="h-5 w-5 shrink-0" style={{ color: '#0EA5E9' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{parseResult.filename}</p>
          <p className="text-xs text-muted-foreground">
            {parseResult.validEmails} valid subscribers will be imported
          </p>
        </div>
      </div>

      {/* Sample rows table */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tags</th>
            </tr>
          </thead>
          <tbody>
            {parseResult.sampleRows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{row.email}</td>
                <td className="px-4 py-2.5 text-foreground">{row.name || '-'}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {row.tags.length > 0
                      ? row.tags.map(tag => (
                          <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))
                      : <span className="text-muted-foreground">-</span>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          Showing {parseResult.sampleRows.length} of {parseResult.totalRows} rows
        </div>
      </div>

      {/* Warning if invalid */}
      {parseResult.invalidEmails > 0 && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {parseResult.invalidEmails} rows with invalid email addresses will be skipped.
          </span>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={onNext}
          style={{ backgroundColor: '#0EA5E9' }}
          className="text-white hover:opacity-90"
        >
          Import {parseResult.validEmails} Subscribers
        </Button>
      </div>
    </div>
  )
}

// ── Step 4: Done ──────────────────────────────────────────────────────────────

function DoneStep({ parseResult, onReset }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <Check className="h-8 w-8 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Import complete</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {parseResult.validEmails} subscribers were successfully imported.
        </p>
      </div>

      {/* Summary */}
      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {[
          { label: 'Imported', value: parseResult.validEmails, color: 'text-emerald-500' },
          { label: 'Skipped', value: parseResult.invalidEmails + parseResult.internalDuplicates, color: 'text-amber-500' },
          { label: 'Total rows', value: parseResult.totalRows, color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 shadow-sm">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset}>
          Import another file
        </Button>
        <Button
          onClick={() => navigate('/app/subscribers')}
          style={{ backgroundColor: '#0EA5E9' }}
          className="text-white hover:opacity-90"
        >
          <Users className="mr-1.5 h-4 w-4" /> View Subscribers
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SubscriberImportPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('upload')
  const [parseResult] = useState(MOCK_PARSE_RESULT)
  const [mapping, setMapping] = useState(null)

  const reset = () => {
    setStep('upload')
    setMapping(null)
  }

  return (
    <DashboardLayout
      title="Import Subscribers"
      subtitle="Import subscribers from a CSV file"
      productColor="#0EA5E9"
    >
      <DashboardLayout.Content>
        {/* Back link */}
        <div>
          <button
            onClick={() => navigate('/app/subscribers')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Subscribers
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center py-2">
          <StepIndicator current={step} />
        </div>

        {/* Step content */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            {step === 'upload' && (
              <UploadStep
                onNext={(_file) => setStep('map')}
              />
            )}
            {step === 'map' && (
              <MapStep
                parseResult={parseResult}
                onNext={(m) => { setMapping(m); setStep('preview') }}
                onBack={() => setStep('upload')}
              />
            )}
            {step === 'preview' && (
              <PreviewStep
                parseResult={parseResult}
                mapping={mapping}
                onNext={() => setStep('done')}
                onBack={() => setStep('map')}
              />
            )}
            {step === 'done' && (
              <DoneStep
                parseResult={parseResult}
                onReset={reset}
              />
            )}
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
