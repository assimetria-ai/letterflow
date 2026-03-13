import { useRef, useEffect } from 'react';

const MarkdownEditor = ({ value, onChange }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Auto-resize textarea based on content
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const insertMarkdown = (syntax) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newText;

    switch (syntax) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'heading':
        newText = `\n## ${selectedText}\n`;
        break;
      case 'link':
        newText = `[${selectedText}](url)`;
        break;
      case 'list':
        newText = `\n- ${selectedText}\n`;
        break;
      case 'quote':
        newText = `\n> ${selectedText}\n`;
        break;
      case 'code':
        newText = `\`${selectedText}\``;
        break;
      default:
        newText = selectedText;
    }

    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Markdown Toolbar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center space-x-2 bg-gray-50">
        <button
          onClick={() => insertMarkdown('bold')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-semibold"
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => insertMarkdown('italic')}
          className="p-2 hover:bg-gray-200 rounded text-sm italic"
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => insertMarkdown('heading')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-bold"
          title="Heading"
        >
          H
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          onClick={() => insertMarkdown('link')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Insert Link"
        >
          🔗
        </button>
        <button
          onClick={() => insertMarkdown('list')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Bulleted List"
        >
          •
        </button>
        <button
          onClick={() => insertMarkdown('quote')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
          title="Quote"
        >
          "
        </button>
        <button
          onClick={() => insertMarkdown('code')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-mono"
          title="Code"
        >
          &lt;/&gt;
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-6">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your newsletter content in Markdown..."
          className="w-full min-h-full resize-none focus:outline-none font-mono text-gray-800"
          style={{ minHeight: '100%' }}
        />
      </div>

      {/* Markdown Guide */}
      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 bg-gray-50">
        <strong>Markdown Quick Reference:</strong> **bold**, *italic*, ## heading, [link](url), - list, &gt; quote, `code`
      </div>
    </div>
  );
};

export default MarkdownEditor;
