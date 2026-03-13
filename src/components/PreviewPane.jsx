import DOMPurify from 'dompurify';

const PreviewPane = ({ htmlContent, title, subject }) => {
  const sanitizedHtml = htmlContent ? DOMPurify.sanitize(htmlContent) : '';

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Email Preview Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="text-xs text-gray-500 mb-2">PREVIEW</div>
        <div className="space-y-1">
          {subject && (
            <div className="font-semibold text-lg">{subject}</div>
          )}
          {title && (
            <div className="text-sm text-gray-600">{title}</div>
          )}
        </div>
      </div>

      {/* Email Body Preview */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto bg-white shadow-sm rounded-lg">
          <div
            className="prose prose-sm max-w-none p-8"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            style={{
              // Email-safe styling
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              lineHeight: '1.6',
              color: '#333'
            }}
          />
        </div>
      </div>

      {/* Preview Info Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            This is how your newsletter will appear in subscribers' inboxes
          </span>
          <span className="text-gray-400">
            Desktop View
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewPane;
