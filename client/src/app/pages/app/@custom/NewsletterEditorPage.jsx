// @custom — Newsletter editor with rich text, preview, auto-save, scheduling
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Save,
  Send,
  Calendar,
  Bold,
  Italic,
  Heading,
  Link2,
  List,
  Quote,
  Code,
  Image,
  SplitSquareVertical,
  Clock,
  Check,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { useAuthContext } from '../../../store/@system/auth'
import { newslettersApi } from '../../../lib/@custom/newsletters'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

// ── View Modes ───────────────────────────────────────────────────────────────
const VIEW_MODES = [
  { value: 'edit', label: 'Edit', icon: Code },
  { value: 'split', label: 'Split', icon: SplitSquareVertical },
  { value: 'preview', label: 'Preview', icon: Eye },
]

// ── Toolbar Actions ──────────────────────────────────────────────────────────
function insertFormatting(textarea, prefix, suffix = '') {
  if (!textarea) return ''
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selected = text.slice(start, end) || 'text'
  const replacement = `${prefix}${selected}${suffix}`
  const newText = text.slice(0, start) + replacement + text.slice(end)

  // Restore cursor after React re-render
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  }, 0)

  return newText
}

export function NewsletterEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const textareaRef = useRef(null)

  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'saved' | 'saving' | 'error'
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [newsletterId, setNewsletterId] = useState(id || null)
  const [viewMode, setViewMode] = useState('split')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  // Convert markdown to sanitized HTML
  const convertToHtml = useCallback((md) => {
    const raw = marked(md || '')
    return DOMPurify.sanitize(raw)
  }, [])

  // Update HTML when content changes
  useEffect(() => {
    setHtmlContent(convertToHtml(content))
  }, [content, convertToHtml])

  // Load newsletter if editing
  useEffect(() => {
    if (id) {
      loadNewsletter(id)
    }
  }, [id])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!title && !content) return
    const interval = setInterval(() => {
      saveDraft(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [title, subject, content, newsletterId])

  async function loadNewsletter(nlId) {
    try {
      const data = await newslettersApi.get(nlId)
      setTitle(data.title || '')
      setSubject(data.settings?.subject || '')
      setContent(data.settings?.plainContent || data.content || '')
      setStatus(data.status || 'draft')
      setNewsletterId(data.id)
    } catch (err) {
      console.error('Failed to load newsletter:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveDraft(isAutoSave = false) {
    if (saving) return
    if (!title.trim() && !content.trim()) return

    setSaving(true)
    setSaveStatus('saving')
    try {
      const payload = {
        title: title.trim() || 'Untitled',
        htmlContent: convertToHtml(content),
        plainContent: content,
        subject,
        status: 'draft',
      }

      let result
      if (newsletterId) {
        result = await newslettersApi.update(newsletterId, payload)
      } else {
        result = await newslettersApi.create(payload)
        setNewsletterId(result.id)
        if (!isAutoSave) {
          navigate(`/app/newsletters/${result.id}/edit`, { replace: true })
        }
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in the title and content before publishing')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        htmlContent: convertToHtml(content),
        plainContent: content,
        subject,
        status: 'published',
        published_at: new Date().toISOString(),
      }
      if (newsletterId) {
        await newslettersApi.update(newsletterId, payload)
      } else {
        await newslettersApi.create({ ...payload, status: 'published' })
      }
      navigate('/app/newsletters')
    } catch (err) {
      console.error('Publish failed:', err)
      alert('Failed to publish newsletter')
    } finally {
      setSaving(false)
    }
  }

  async function handleSchedule() {
    if (!scheduleDate || !scheduleTime) {
      alert('Please select a date and time')
      return
    }
    const scheduled_at = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

    // Save content first
    if (!newsletterId) {
      const result = await newslettersApi.create({
        title: title.trim() || 'Untitled',
        htmlContent: convertToHtml(content),
        plainContent: content,
        subject,
        status: 'draft',
      })
      setNewsletterId(result.id)
      await newslettersApi.schedule(result.id, scheduled_at)
    } else {
      await newslettersApi.update(newsletterId, {
        title: title.trim(),
        htmlContent: convertToHtml(content),
        plainContent: content,
        subject,
      })
      await newslettersApi.schedule(newsletterId, scheduled_at)
    }
    setShowScheduleModal(false)
    navigate('/app/newsletters')
  }

  function handleToolbar(action) {
    const ta = textareaRef.current
    if (!ta) return
    let newContent
    switch (action) {
      case 'bold':
        newContent = insertFormatting(ta, '**', '**')
        break
      case 'italic':
        newContent = insertFormatting(ta, '*', '*')
        break
      case 'heading':
        newContent = insertFormatting(ta, '## ')
        break
      case 'link':
        newContent = insertFormatting(ta, '[', '](url)')
        break
      case 'list':
        newContent = insertFormatting(ta, '- ')
        break
      case 'quote':
        newContent = insertFormatting(ta, '> ')
        break
      case 'code':
        newContent = insertFormatting(ta, '`', '`')
        break
      case 'image':
        newContent = insertFormatting(ta, '![alt](', ')')
        break
      default:
        return
    }
    setContent(newContent)
  }

  if (loading) {
    return (
      <DashboardLayout navItems={LETTERFLOW_NAV_ITEMS}>
        <div className="flex items-center justify-center h-full text-gray-500 text-lg">Loading editor...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={LETTERFLOW_NAV_ITEMS} showSidebar={true}>
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/newsletters')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <input
            type="text"
            placeholder="Newsletter Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="text"
            placeholder="Email Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}

          {/* View mode toggle */}
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-colors ${
                  viewMode === mode.value
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={mode.label}
              >
                <mode.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => saveDraft(false)}>
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="w-4 h-4 mr-1" /> Schedule
          </Button>
          <Button size="sm" onClick={handlePublish}>
            <Send className="w-4 h-4 mr-1" /> Publish
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      {viewMode !== 'preview' && (
        <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-1 bg-gray-50">
          {[
            { action: 'bold', icon: Bold, title: 'Bold' },
            { action: 'italic', icon: Italic, title: 'Italic' },
            { action: 'heading', icon: Heading, title: 'Heading' },
            { action: 'link', icon: Link2, title: 'Link' },
            { action: 'list', icon: List, title: 'List' },
            { action: 'quote', icon: Quote, title: 'Quote' },
            { action: 'code', icon: Code, title: 'Code' },
            { action: 'image', icon: Image, title: 'Image' },
          ].map((btn) => (
            <button
              key={btn.action}
              onClick={() => handleToolbar(btn.action)}
              title={btn.title}
              className="p-2 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <btn.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor pane */}
        {viewMode !== 'preview' && (
          <div className={`flex-1 flex flex-col ${viewMode === 'split' ? 'border-r border-gray-200' : ''}`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your newsletter content in Markdown..."
              className="flex-1 p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
              style={{ minHeight: 0 }}
            />
          </div>
        )}

        {/* Preview pane */}
        {viewMode !== 'edit' && (
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-2xl mx-auto p-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                {/* Email header preview */}
                <div className="border-b border-gray-100 pb-4 mb-6">
                  <div className="text-xs text-gray-400 mb-1">Subject</div>
                  <div className="font-medium text-gray-900">{subject || 'No subject'}</div>
                </div>
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">{title || 'Untitled Newsletter'}</h1>
                {/* HTML content */}
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-gray-400">Start writing to see preview...</p>' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-500" />
              Schedule Newsletter
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedule}>
                <Calendar className="w-4 h-4 mr-1" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  )
}
