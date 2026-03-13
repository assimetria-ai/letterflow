import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function SubscriberImport() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Auto-preview
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/api/subscribers/import/preview`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setPreview(data);
    } catch (err) {
      setError(err.message);
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/subscribers/import`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Subscribers</h1>
          <p className="text-gray-500 mt-1">Upload a CSV file to bulk import subscribers</p>
        </div>
        <Link to="/newsletters" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Newsletters
        </Link>
      </div>

      {/* CSV Format Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">CSV Format</h3>
        <p className="text-sm text-gray-500 mb-2">
          Required column: <code className="bg-gray-100 px-1 rounded">email</code>. 
          Optional: <code className="bg-gray-100 px-1 rounded">name</code>, 
          <code className="bg-gray-100 px-1 rounded">tags</code> (comma-separated). 
          Any other columns are saved as custom fields.
        </p>
        <pre className="text-xs text-gray-600 bg-white border rounded p-2 overflow-x-auto">
{`email,name,tags,company
john@example.com,John Doe,"tech,startup",Acme Inc
jane@example.com,Jane Smith,marketing,BigCo`}
        </pre>
      </div>

      {/* Upload Area */}
      {!result && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : file
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
          {file ? (
            <div>
              <div className="text-green-600 text-lg mb-1">{file.name}</div>
              <div className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetState(); }}
                className="mt-3 text-sm text-red-500 hover:text-red-700"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600">Drop your CSV file here, or click to browse</p>
              <p className="text-sm text-gray-400 mt-1">Max file size: 10MB</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{preview.totalRows}</div>
              <div className="text-xs text-gray-500">Total Rows</div>
            </div>
            <div className="bg-white border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{preview.validEmails}</div>
              <div className="text-xs text-gray-500">Valid Emails</div>
            </div>
            <div className="bg-white border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-500">{preview.invalidEmails}</div>
              <div className="text-xs text-gray-500">Invalid Emails</div>
            </div>
            <div className="bg-white border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-500">{preview.duplicatesInFile}</div>
              <div className="text-xs text-gray-500">Duplicates in File</div>
            </div>
          </div>

          {/* Detected columns */}
          <div className="mb-4">
            <span className="text-sm text-gray-600">Detected columns: </span>
            {preview.headers.map(h => (
              <span key={h} className={`inline-block text-xs px-2 py-0.5 rounded mr-1 mb-1 ${
                h === 'email' ? 'bg-blue-100 text-blue-700' :
                ['name', 'tags', 'status'].includes(h) ? 'bg-gray-100 text-gray-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {h}{preview.customFields.includes(h) ? ' (custom)' : ''}
              </span>
            ))}
          </div>

          {/* Sample Data Table */}
          {preview.preview && preview.preview.length > 0 && (
            <div className="overflow-x-auto border rounded-lg mb-4">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {preview.headers.map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.preview.map((row, i) => (
                    <tr key={i}>
                      {preview.headers.map(h => (
                        <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap">{row[h] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.totalRows > 5 && (
                <div className="text-xs text-gray-400 text-center py-2">
                  Showing 5 of {preview.totalRows} rows
                </div>
              )}
            </div>
          )}

          {/* Import Button */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={importing || preview.validEmails === 0}
              className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
                importing || preview.validEmails === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </span>
              ) : (
                `Import ${preview.validEmails} Subscriber${preview.validEmails !== 1 ? 's' : ''}`
              )}
            </button>
            <button
              onClick={resetState}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import Result */}
      {result && (
        <div className="mt-6">
          <div className={`rounded-lg p-6 ${
            result.summary.errors > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              result.summary.errors > 0 ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {result.summary.errors > 0 ? 'Import Completed with Warnings' : 'Import Successful'}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                <div className="text-xs text-gray-500">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{result.summary.imported}</div>
                <div className="text-xs text-gray-500">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{result.summary.duplicates}</div>
                <div className="text-xs text-gray-500">Duplicates Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{result.summary.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>

            {result.summary.customFields && (
              <p className="text-sm text-gray-600 mb-3">
                Custom fields imported: {result.summary.customFields.join(', ')}
              </p>
            )}

            {/* Error Details */}
            {result.errors && result.errors.length > 0 && (
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
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={resetState}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Import More
            </button>
            <Link
              to="/newsletters"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Newsletters
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
