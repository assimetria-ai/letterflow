import { useState, useEffect } from 'react';

const API_BASE = '/api/ab-tests';

const TEST_TYPES = [
  { value: 'subject_line', label: 'Subject Line' },
  { value: 'content', label: 'Content' },
  { value: 'send_time', label: 'Send Time' },
];

const WINNER_CRITERIA = [
  { value: 'open_rate', label: 'Open Rate' },
  { value: 'click_rate', label: 'Click Rate' },
];

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function ABTestManager({ newsletterId, campaignId }) {
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form state
  const [form, setForm] = useState({
    name: '',
    test_type: 'subject_line',
    sample_percentage: 20,
    winner_criteria: 'open_rate',
    auto_send_winner: true,
    winner_wait_hours: 4,
  });

  useEffect(() => {
    fetchTests();
  }, [newsletterId]);

  async function fetchTests() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (newsletterId) params.set('newsletter_id', newsletterId);
      const res = await fetch(`${API_BASE}?${params}`);
      const json = await res.json();
      setTests(json.data || []);
    } catch (err) {
      setError('Failed to load A/B tests');
    } finally {
      setLoading(false);
    }
  }

  async function createTest(e) {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          campaign_id: campaignId,
          newsletter_id: newsletterId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTests([json.data, ...tests]);
      setShowCreate(false);
      setForm({ name: '', test_type: 'subject_line', sample_percentage: 20,
        winner_criteria: 'open_rate', auto_send_winner: true, winner_wait_hours: 4 });
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewTest(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const json = await res.json();
      setSelectedTest(json.data);
    } catch (err) {
      setError('Failed to load test details');
    }
  }

  async function startTest(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/start`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSelectedTest(json.data);
      fetchTests();
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeTest(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}/complete`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSelectedTest(json.data);
      fetchTests();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTest(id) {
    if (!confirm('Delete this A/B test?')) return;
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      setTests(tests.filter(t => t.id !== id));
      if (selectedTest?.id === id) setSelectedTest(null);
    } catch (err) {
      setError('Failed to delete test');
    }
  }

  async function updateVariant(testId, variantId, data) {
    try {
      const res = await fetch(`${API_BASE}/${testId}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      // Refresh test details
      viewTest(testId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addVariant(testId) {
    try {
      const variantCount = selectedTest?.variants?.length || 0;
      const name = `Variant ${String.fromCharCode(65 + variantCount)}`;
      const res = await fetch(`${API_BASE}/${testId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, percentage: Math.floor(100 / (variantCount + 1)) }),
      });
      if (!res.ok) throw new Error('Failed to add variant');
      viewTest(testId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteVariant(testId, variantId) {
    try {
      await fetch(`${API_BASE}/${testId}/variants/${variantId}`, { method: 'DELETE' });
      viewTest(testId);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading A/B tests...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">A/B Testing</h2>
          <p className="text-sm text-gray-500 mt-1">
            Test subject lines, content, and send times to optimize your campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
        >
          {showCreate ? 'Cancel' : 'New A/B Test'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={createTest} className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Create A/B Test</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., March Newsletter Subject Test"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
              <select
                value={form.test_type}
                onChange={e => setForm({ ...form, test_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {TEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Winner Criteria</label>
              <select
                value={form.winner_criteria}
                onChange={e => setForm({ ...form, winner_criteria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {WINNER_CRITERIA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Size: {form.sample_percentage}%
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={form.sample_percentage}
                onChange={e => setForm({ ...form, sample_percentage: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.sample_percentage}% of subscribers receive test variants, winner goes to remaining {100 - form.sample_percentage}%
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wait before selecting winner
              </label>
              <select
                value={form.winner_wait_hours}
                onChange={e => setForm({ ...form, winner_wait_hours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={8}>8 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_send"
                checked={form.auto_send_winner}
                onChange={e => setForm({ ...form, auto_send_winner: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="auto_send" className="text-sm text-gray-700">
                Automatically send winning variant to remaining subscribers
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm font-medium"
            >
              Create Test
            </button>
          </div>
        </form>
      )}

      {/* Test List */}
      {tests.length === 0 && !showCreate ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">🧪</div>
          <h3 className="text-lg font-semibold text-gray-900">No A/B tests yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first test to optimize your campaigns</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(test => (
            <div
              key={test.id}
              className={`p-4 bg-white border rounded-xl cursor-pointer hover:border-sky-300 transition-colors ${
                selectedTest?.id === test.id ? 'border-sky-500 ring-1 ring-sky-500' : 'border-gray-200'
              }`}
              onClick={() => viewTest(test.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{test.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{TEST_TYPES.find(t => t.value === test.test_type)?.label || test.test_type}</span>
                    <span>·</span>
                    <span>{test.variant_count || 0} variants</span>
                    {test.campaign_name && (
                      <>
                        <span>·</span>
                        <span>{test.campaign_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[test.status] || STATUS_COLORS.draft}`}>
                    {test.status}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); deleteTest(test.id); }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Detail / Variant Editor */}
      {selectedTest && (
        <div className="mt-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold">{selectedTest.name}</h3>
              <p className="text-sm text-gray-500">
                {TEST_TYPES.find(t => t.value === selectedTest.test_type)?.label} test ·
                Winner by {WINNER_CRITERIA.find(c => c.value === selectedTest.winner_criteria)?.label} ·
                {selectedTest.sample_percentage}% sample
              </p>
            </div>
            <div className="flex gap-2">
              {selectedTest.status === 'draft' && (
                <>
                  <button
                    onClick={() => addVariant(selectedTest.id)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Add Variant
                  </button>
                  <button
                    onClick={() => startTest(selectedTest.id)}
                    className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600"
                  >
                    Start Test
                  </button>
                </>
              )}
              {selectedTest.status === 'running' && (
                <button
                  onClick={() => completeTest(selectedTest.id)}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  Pick Winner
                </button>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            {(selectedTest.variants || []).map((variant, idx) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                index={idx}
                testType={selectedTest.test_type}
                testStatus={selectedTest.status}
                onUpdate={(data) => updateVariant(selectedTest.id, variant.id, data)}
                onDelete={() => deleteVariant(selectedTest.id, variant.id)}
              />
            ))}
          </div>

          {/* Results summary for completed tests */}
          {selectedTest.status === 'completed' && selectedTest.winner_variant_id && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-semibold">Winner:</span>
                <span className="text-green-800">
                  {selectedTest.variants?.find(v => v.id === selectedTest.winner_variant_id)?.name || 'Unknown'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VariantCard({ variant, index, testType, testStatus, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [localData, setLocalData] = useState({
    subject_line: variant.subject_line || '',
    preview_text: variant.preview_text || '',
    content: variant.content || '',
    percentage: variant.percentage || 50,
  });

  const isDraft = testStatus === 'draft';
  const letter = String.fromCharCode(65 + index);
  const colors = ['border-l-sky-500', 'border-l-purple-500', 'border-l-amber-500', 'border-l-emerald-500'];

  function handleSave() {
    onUpdate(localData);
    setEditing(false);
  }

  return (
    <div className={`border border-gray-200 rounded-lg ${colors[index % colors.length]} border-l-4 ${variant.is_winner ? 'ring-2 ring-green-400' : ''}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
              {letter}
            </span>
            <span className="font-medium">{variant.name}</span>
            {variant.is_winner && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                Winner
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{variant.percentage}% of sample</span>
            {isDraft && (
              <>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-sky-500 hover:text-sky-700 text-sm"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
                {index >= 2 && (
                  <button onClick={onDelete} className="text-red-400 hover:text-red-600 text-sm">
                    Remove
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats (shown for running/completed) */}
        {testStatus !== 'draft' && (
          <div className="grid grid-cols-4 gap-3 mb-3">
            <StatBox label="Sends" value={variant.sends} />
            <StatBox label="Opens" value={variant.opens} rate={variant.open_rate} />
            <StatBox label="Clicks" value={variant.clicks} rate={variant.click_rate} />
            <StatBox label="Unsubs" value={variant.unsubscribes} />
          </div>
        )}

        {/* Edit mode */}
        {editing && isDraft && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            {(testType === 'subject_line' || testType === 'content') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={localData.subject_line}
                  onChange={e => setLocalData({ ...localData, subject_line: e.target.value })}
                  placeholder="Enter subject line for this variant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
            {(testType === 'subject_line' || testType === 'content') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preview Text</label>
                <input
                  type="text"
                  value={localData.preview_text}
                  onChange={e => setLocalData({ ...localData, preview_text: e.target.value })}
                  placeholder="Preview text shown in inbox"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
            {testType === 'content' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                <textarea
                  value={localData.content}
                  onChange={e => setLocalData({ ...localData, content: e.target.value })}
                  placeholder="Email content for this variant"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Traffic Split: {localData.percentage}%
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={localData.percentage}
                onChange={e => setLocalData({ ...localData, percentage: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600"
            >
              Save Variant
            </button>
          </div>
        )}

        {/* Read-only display */}
        {!editing && variant.subject_line && (
          <div className="text-sm text-gray-600 mt-1">
            <span className="text-gray-400">Subject:</span> {variant.subject_line}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, rate }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-lg font-bold text-gray-900">{value || 0}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {rate !== undefined && rate > 0 && (
        <div className="text-xs text-sky-600 font-medium">{rate}%</div>
      )}
    </div>
  );
}
