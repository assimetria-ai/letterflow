import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = {
  general: 'bg-gray-100 text-gray-700',
  welcome: 'bg-green-100 text-green-700',
  digest: 'bg-blue-100 text-blue-700',
  announcement: 'bg-purple-100 text-purple-700',
  promotional: 'bg-orange-100 text-orange-700',
  editorial: 'bg-red-100 text-red-700',
  personal: 'bg-amber-100 text-amber-700',
  saas: 'bg-indigo-100 text-indigo-700',
};

const TemplateList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleClone = async (id) => {
    try {
      const response = await fetch(`/api/templates/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const cloned = await response.json();
        navigate(`/templates/${cloned.id}/edit`);
      }
    } catch (error) {
      console.error('Error cloning template:', error);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (filter === 'system' && !t.isSystem) return false;
    if (filter === 'custom' && t.isSystem) return false;
    if (filter !== 'all' && filter !== 'system' && filter !== 'custom' && t.category !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-sm text-gray-500 mt-1">
                Design reusable newsletter templates with the visual editor
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/newsletters')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Newsletters
              </button>
              <button
                onClick={() => navigate('/templates/new')}
                className="px-4 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700"
              >
                + New Template
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              {['all', 'system', 'custom', 'general', 'welcome', 'digest', 'announcement', 'promotional'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    filter === f
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </header>

      {/* Template Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">No templates found</div>
            <p className="text-sm text-gray-500">
              {filter !== 'all' ? 'Try a different filter or ' : ''}
              <button
                onClick={() => navigate('/templates/new')}
                className="text-sky-600 hover:underline"
              >
                create your first template
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(t => (
              <div
                key={t.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Preview thumbnail */}
                <div className="h-48 bg-gray-100 border-b border-gray-200 overflow-hidden relative">
                  <div
                    className="p-4 text-xs transform scale-[0.6] origin-top-left w-[166%] h-[166%]"
                    dangerouslySetInnerHTML={{
                      __html: t.htmlContent
                        ? t.htmlContent.slice(0, 500) + (t.htmlContent.length > 500 ? '...' : '')
                        : '<p style="color: #ccc; text-align: center; padding-top: 40px;">Empty template</p>'
                    }}
                  />
                  {t.isSystem && (
                    <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded">
                      System
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.general}`}>
                      {t.category}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex items-center space-x-2">
                    {t.isSystem ? (
                      <button
                        onClick={() => handleClone(t.id)}
                        className="flex-1 px-3 py-1.5 text-xs text-sky-600 border border-sky-200 rounded-md hover:bg-sky-50"
                      >
                        Clone & Edit
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/templates/${t.id}/edit`)}
                          className="flex-1 px-3 py-1.5 text-xs text-sky-600 border border-sky-200 rounded-md hover:bg-sky-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleClone(t.id)}
                          className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50"
                        >
                          Clone
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-md hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateList;
