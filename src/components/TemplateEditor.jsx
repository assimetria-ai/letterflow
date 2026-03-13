import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import VariableChip from './VariableChip';
import TemplatePreview from './TemplatePreview';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'digest', label: 'Digest' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'personal', label: 'Personal' },
  { value: 'saas', label: 'SaaS / Product' },
];

const DYNAMIC_VARIABLES = [
  { key: '{{FIRST_NAME}}', label: 'First Name', preview: 'Jane' },
  { key: '{{LAST_NAME}}', label: 'Last Name', preview: 'Doe' },
  { key: '{{EMAIL}}', label: 'Email', preview: 'jane@example.com' },
  { key: '{{BRAND_NAME}}', label: 'Brand Name', preview: 'LetterFlow' },
  { key: '{{UNSUBSCRIBE_URL}}', label: 'Unsubscribe URL', preview: '#unsubscribe' },
  { key: '{{WEB_VERSION_URL}}', label: 'Web Version URL', preview: '#web-version' },
  { key: '{{CURRENT_DATE}}', label: 'Current Date', preview: new Date().toLocaleDateString() },
  { key: '{{ISSUE_NUMBER}}', label: 'Issue Number', preview: '42' },
];

const TemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    htmlContent: '',
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: 8px;',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #0EA5E9; text-decoration: underline;',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start designing your email template...',
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setTemplate(prev => ({
        ...prev,
        htmlContent: editor.getHTML(),
      }));
    },
  });

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  useEffect(() => {
    if (editor && template.htmlContent && loading) {
      editor.commands.setContent(template.htmlContent);
    }
  }, [editor, template.htmlContent, loading]);

  const loadTemplate = async (templateId) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
        if (editor) {
          editor.commands.setContent(data.htmlContent || '');
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!template.name) {
      alert('Please enter a template name');
      return;
    }

    setSaving(true);
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/templates/${id}` : '/api/templates';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          htmlContent: template.htmlContent || (editor ? editor.getHTML() : ''),
          category: template.category,
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        if (!id) {
          navigate(`/templates/${saved.id}/edit`, { replace: true });
        }
        alert('Template saved successfully');
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable) => {
    if (editor) {
      editor.chain().focus().insertContent(variable.key).run();
    }
    setShowVariables(false);
  };

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url, target: '_blank' }).run();
    }
  }, [editor]);

  const insertButton = useCallback(() => {
    const text = window.prompt('Button text:', 'Click Here');
    const url = window.prompt('Button URL:', 'https://');
    if (text && url && editor) {
      const buttonHtml = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px auto;">
        <tr>
          <td style="background-color: #0EA5E9; border-radius: 8px; padding: 12px 24px;">
            <a href="${url}" target="_blank" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">${text}</a>
          </td>
        </tr>
      </table>`;
      editor.chain().focus().insertContent(buttonHtml).run();
    }
  }, [editor]);

  const setTextColor = useCallback(() => {
    const color = window.prompt('Enter hex color (e.g. #ff0000):', '#000000');
    if (color && editor) {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading template...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => navigate('/templates')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Templates
            </button>
            <input
              type="text"
              placeholder="Template Name"
              value={template.name}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
            <select
              value={template.category}
              onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            {saving && <span className="text-xs text-gray-500">Saving...</span>}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 text-sm rounded-md border ${
                showPreview ? 'bg-sky-50 border-sky-300 text-sky-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {showPreview ? 'Editor' : 'Preview'}
            </button>
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50"
            >
              Save Template
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Template description (optional)"
            value={template.description || ''}
            onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </header>

      {showPreview ? (
        <TemplatePreview htmlContent={template.htmlContent} variables={DYNAMIC_VARIABLES} />
      ) : (
        <>
          {/* Toolbar */}
          <div className="border-b border-gray-200 px-6 py-2 flex items-center space-x-1 flex-shrink-0 flex-wrap gap-y-1">
            {/* Text formatting */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              title="Bold"
            >
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              title="Italic"
            >
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive('underline')}
              title="Underline"
            >
              <span className="underline">U</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              active={editor?.isActive('strike')}
              title="Strikethrough"
            >
              <span className="line-through">S</span>
            </ToolbarButton>

            <ToolbarDivider />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor?.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              H1
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor?.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor?.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolbarButton>

            <ToolbarDivider />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              active={editor?.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              ≡
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              active={editor?.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              ≡
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              active={editor?.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              ≡
            </ToolbarButton>

            <ToolbarDivider />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              title="Bullet List"
            >
              • List
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              title="Numbered List"
            >
              1. List
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              active={editor?.isActive('blockquote')}
              title="Blockquote"
            >
              " Quote
            </ToolbarButton>

            <ToolbarDivider />

            {/* Color */}
            <ToolbarButton onClick={setTextColor} title="Text Color">
              A
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
              active={editor?.isActive('highlight')}
              title="Highlight"
            >
              H
            </ToolbarButton>

            <ToolbarDivider />

            {/* Insert */}
            <ToolbarButton onClick={addImage} title="Insert Image">
              Image
            </ToolbarButton>
            <ToolbarButton onClick={addLink} title="Insert Link">
              Link
            </ToolbarButton>
            <ToolbarButton onClick={insertButton} title="Insert Button (CTA)">
              Button
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              ―
            </ToolbarButton>

            <ToolbarDivider />

            {/* Dynamic Variables */}
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowVariables(!showVariables)}
                active={showVariables}
                title="Insert Dynamic Variable"
              >
                {'{{ }}'}  Variables
              </ToolbarButton>
              {showVariables && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase">Dynamic Variables</span>
                  </div>
                  {DYNAMIC_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable(v)}
                      className="w-full text-left px-3 py-2 hover:bg-sky-50 flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-gray-800">{v.label}</span>
                      <code className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{v.key}</code>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ToolbarDivider />

            {/* Undo / Redo */}
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              title="Undo"
            >
              ↩
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              title="Redo"
            >
              ↪
            </ToolbarButton>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto py-8 px-6">
              <div className="border border-gray-200 rounded-lg shadow-sm bg-white min-h-[500px]">
                <EditorContent
                  editor={editor}
                  className="prose prose-sm max-w-none p-6 focus:outline-none template-editor"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Toolbar sub-components
const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-2 py-1 text-xs rounded transition-colors ${
      active
        ? 'bg-sky-100 text-sky-700'
        : disabled
        ? 'text-gray-300 cursor-not-allowed'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-5 bg-gray-200 mx-1" />
);

export default TemplateEditor;
