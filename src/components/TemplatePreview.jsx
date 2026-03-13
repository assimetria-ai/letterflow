import { useState, useMemo } from 'react';

const PREVIEW_DEVICES = [
  { key: 'desktop', label: 'Desktop', width: '100%', maxWidth: '680px' },
  { key: 'tablet', label: 'Tablet', width: '100%', maxWidth: '480px' },
  { key: 'mobile', label: 'Mobile', width: '100%', maxWidth: '375px' },
];

const TemplatePreview = ({ htmlContent, variables = [] }) => {
  const [device, setDevice] = useState('desktop');
  const [showVariablePreview, setShowVariablePreview] = useState(true);

  const currentDevice = PREVIEW_DEVICES.find(d => d.key === device);

  // Replace dynamic variables with preview values
  const resolvedHtml = useMemo(() => {
    if (!htmlContent) return '<p style="color: #999; text-align: center; padding: 40px;">No content to preview</p>';

    let html = htmlContent;
    if (showVariablePreview) {
      variables.forEach(v => {
        html = html.replaceAll(
          v.key,
          `<span style="background: #dbeafe; color: #1e40af; padding: 1px 4px; border-radius: 3px; font-size: 0.875em;">${v.preview}</span>`
        );
      });
    }

    // Wrap in email-like container
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; padding: 24px;">
        ${html}
      </div>
    `;
  }, [htmlContent, variables, showVariablePreview]);

  return (
    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          {PREVIEW_DEVICES.map(d => (
            <button
              key={d.key}
              onClick={() => setDevice(d.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                device === d.key
                  ? 'bg-sky-100 text-sky-700 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="flex items-center space-x-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showVariablePreview}
            onChange={(e) => setShowVariablePreview(e.target.checked)}
            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span>Resolve variables</span>
        </label>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 overflow-auto flex justify-center py-8 px-4">
        <div
          className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden transition-all duration-300"
          style={{
            width: currentDevice.width,
            maxWidth: currentDevice.maxWidth,
            minHeight: '400px',
          }}
        >
          {/* Simulated email header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>From: <span className="text-gray-600">newsletter@letterflow.com</span></div>
              <div>Subject: <span className="text-gray-600">Your Newsletter</span></div>
            </div>
          </div>

          {/* Email content */}
          <div
            className="template-preview-content"
            dangerouslySetInnerHTML={{ __html: resolvedHtml }}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
