import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import MarkdownEditor from './MarkdownEditor';
import ImageUploader from './ImageUploader';
import PreviewPane from './PreviewPane';

const NewsletterEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [newsletter, setNewsletter] = useState({
    title: '',
    subject: '',
    htmlContent: '',
    plainContent: '',
    status: 'draft'
  });
  const [markdownContent, setMarkdownContent] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'split', 'preview'
  const [showImageUpload, setShowImageUpload] = useState(false);

  // Load newsletter if editing
  useEffect(() => {
    if (id) {
      loadNewsletter(id);
    }
  }, [id]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (markdownContent || newsletter.title || newsletter.subject) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [markdownContent, newsletter]);

  const loadNewsletter = async (newsletterId) => {
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}`);
      if (response.ok) {
        const data = await response.json();
        setNewsletter(data);
        setMarkdownContent(data.plainContent || '');
      } else {
        console.error('Failed to load newsletter');
      }
    } catch (error) {
      console.error('Error loading newsletter:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertMarkdownToHtml = (markdown) => {
    const rawHtml = marked(markdown);
    return DOMPurify.sanitize(rawHtml);
  };

  const handleMarkdownChange = (value) => {
    setMarkdownContent(value);
    const htmlContent = convertMarkdownToHtml(value);
    setNewsletter(prev => ({
      ...prev,
      htmlContent,
      plainContent: value
    }));
  };

  const handleFieldChange = (field, value) => {
    setNewsletter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageInsert = (imageUrl) => {
    const imageMarkdown = `\n![](${imageUrl})\n`;
    setMarkdownContent(prev => prev + imageMarkdown);
    handleMarkdownChange(markdownContent + imageMarkdown);
    setShowImageUpload(false);
  };

  const saveDraft = async () => {
    if (saving) return;
    
    setSaving(true);
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/newsletters/${id}` : '/api/newsletters';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newsletter,
          status: 'draft'
        }),
      });

      if (response.ok) {
        const saved = await response.json();
        if (!id) {
          navigate(`/newsletters/${saved.id}/edit`, { replace: true });
        }
        console.log('Draft saved successfully');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!newsletter.title || !newsletter.subject || !markdownContent) {
      alert('Please fill in title, subject, and content before publishing');
      return;
    }

    setSaving(true);
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/newsletters/${id}` : '/api/newsletters';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newsletter,
          status: 'published',
          publishedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Newsletter published successfully!');
        navigate('/newsletters');
      }
    } catch (error) {
      console.error('Error publishing newsletter:', error);
      alert('Failed to publish newsletter');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => navigate('/newsletters')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Newsletter Title"
                value={newsletter.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Email Subject Line"
                value={newsletter.subject}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {saving && <span className="text-sm text-gray-500">Saving...</span>}
            <button
              onClick={saveDraft}
              disabled={saving}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImageUpload(!showImageUpload)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              📷 Insert Image
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'edit' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'split' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'preview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploader
          onImageInsert={handleImageInsert}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-gray-200`}>
            <MarkdownEditor
              value={markdownContent}
              onChange={handleMarkdownChange}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <PreviewPane
              htmlContent={newsletter.htmlContent}
              title={newsletter.title}
              subject={newsletter.subject}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsletterEditor;
