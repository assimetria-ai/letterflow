import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = '/api/automations';

const TRIGGER_TYPES = [
  { value: 'signup', label: 'On Signup', icon: '👤', desc: 'When a new subscriber signs up' },
  { value: 'tag_change', label: 'Tag Change', icon: '🏷️', desc: 'When a subscriber tag is added or removed' },
  { value: 'link_click', label: 'Link Click', icon: '🔗', desc: 'When a subscriber clicks a specific link' },
];

const STEP_TYPES = [
  { value: 'email', label: 'Send Email', icon: '✉️', color: '#0EA5E9' },
  { value: 'delay', label: 'Wait / Delay', icon: '⏱️', color: '#F59E0B' },
  { value: 'condition', label: 'Condition', icon: '🔀', color: '#8B5CF6' },
  { value: 'ab_split', label: 'A/B Split', icon: '⚖️', color: '#10B981' },
];

const STATUS_COLORS = {
  draft: { bg: '#F3F4F6', text: '#6B7280', label: 'Draft' },
  active: { bg: '#D1FAE5', text: '#059669', label: 'Active' },
  paused: { bg: '#FEF3C7', text: '#D97706', label: 'Paused' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.text,
    }}>
      {s.label}
    </span>
  );
}

function MetricsBar({ metrics }) {
  if (!metrics) return null;
  const items = [
    { label: 'Sent', value: metrics.sent, color: '#6B7280' },
    { label: 'Opened', value: metrics.opened, color: '#0EA5E9' },
    { label: 'Clicked', value: metrics.clicked, color: '#8B5CF6' },
    { label: 'Converted', value: metrics.converted, color: '#10B981' },
  ];
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
      {items.map(m => (
        <div key={m.label} style={{ fontSize: 11, color: m.color }}>
          <span style={{ fontWeight: 600 }}>{m.value}</span> {m.label}
        </div>
      ))}
    </div>
  );
}

// ─── List View ───
function AutomationList() {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(API_BASE)
      .then(r => r.json())
      .then(d => setAutomations(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this automation?')) return;
    await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Automation Workflows</h1>
        <button
          onClick={() => navigate('/automations/new')}
          style={{
            padding: '10px 20px',
            background: '#0EA5E9',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + New Automation
        </button>
      </div>

      {automations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h3 style={{ margin: '0 0 8px', fontWeight: 600 }}>No automations yet</h3>
          <p style={{ color: '#6B7280', margin: 0 }}>Create your first drip campaign to start engaging subscribers automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {automations.map(a => (
            <div
              key={a.id}
              onClick={() => navigate(`/automations/${a.id}`)}
              style={{
                padding: 20,
                background: '#fff',
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{a.name}</h3>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.description && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>{a.description}</p>
                  )}
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                    Trigger: {TRIGGER_TYPES.find(t => t.value === a.trigger_type)?.label || a.trigger_type}
                    {' · '}
                    {a.step_count || 0} step{a.step_count !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(a.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: '4px 8px',
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step Card ───
function StepCard({ step, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState(step.config || {});
  const typeInfo = STEP_TYPES.find(t => t.value === step.step_type) || STEP_TYPES[0];

  const handleSave = () => {
    onUpdate(step.id, { config });
    setEditing(false);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      border: `2px solid ${typeInfo.color}20`,
      borderLeft: `4px solid ${typeInfo.color}`,
      padding: 16,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{typeInfo.icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              Step {index + 1}: {typeInfo.label}
            </div>
            {!editing && step.step_type === 'email' && config.template_name && (
              <div style={{ fontSize: 12, color: '#6B7280' }}>Template: {config.template_name}</div>
            )}
            {!editing && step.step_type === 'delay' && (
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Wait {config.duration || 1} {config.unit || 'days'}
              </div>
            )}
            {!editing && step.step_type === 'condition' && (
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                If {config.condition_type || 'opened'} → {config.true_action || 'continue'} / {config.false_action || 'skip'}
              </div>
            )}
            {!editing && step.step_type === 'ab_split' && (
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                Split: {config.split_a || 50}% / {config.split_b || 50}%
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isFirst && (
            <button onClick={() => onMoveUp(step.id)} style={iconBtnStyle} title="Move up">↑</button>
          )}
          {!isLast && (
            <button onClick={() => onMoveDown(step.id)} style={iconBtnStyle} title="Move down">↓</button>
          )}
          <button onClick={() => setEditing(!editing)} style={iconBtnStyle} title="Edit">✏️</button>
          <button onClick={() => onDelete(step.id)} style={{ ...iconBtnStyle, color: '#EF4444' }} title="Delete">✕</button>
        </div>
      </div>

      {editing && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
          {step.step_type === 'email' && (
            <>
              <label style={labelStyle}>Template Name</label>
              <input
                style={inputStyle}
                value={config.template_name || ''}
                onChange={e => setConfig({ ...config, template_name: e.target.value })}
                placeholder="e.g. Welcome Email"
              />
              <label style={labelStyle}>Subject Line</label>
              <input
                style={inputStyle}
                value={config.subject || ''}
                onChange={e => setConfig({ ...config, subject: e.target.value })}
                placeholder="e.g. Welcome to our newsletter!"
              />
            </>
          )}
          {step.step_type === 'delay' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Duration</label>
                <input
                  type="number"
                  min={1}
                  style={inputStyle}
                  value={config.duration || 1}
                  onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Unit</label>
                <select
                  style={inputStyle}
                  value={config.unit || 'days'}
                  onChange={e => setConfig({ ...config, unit: e.target.value })}
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          )}
          {step.step_type === 'condition' && (
            <>
              <label style={labelStyle}>Condition Type</label>
              <select
                style={inputStyle}
                value={config.condition_type || 'opened'}
                onChange={e => setConfig({ ...config, condition_type: e.target.value })}
              >
                <option value="opened">Opened previous email</option>
                <option value="clicked">Clicked a link</option>
                <option value="has_tag">Has tag</option>
              </select>
              {config.condition_type === 'has_tag' && (
                <>
                  <label style={labelStyle}>Tag Name</label>
                  <input
                    style={inputStyle}
                    value={config.tag_name || ''}
                    onChange={e => setConfig({ ...config, tag_name: e.target.value })}
                    placeholder="e.g. premium"
                  />
                </>
              )}
              <label style={labelStyle}>If True</label>
              <select
                style={inputStyle}
                value={config.true_action || 'continue'}
                onChange={e => setConfig({ ...config, true_action: e.target.value })}
              >
                <option value="continue">Continue to next step</option>
                <option value="skip">Skip next step</option>
                <option value="end">End workflow</option>
              </select>
              <label style={labelStyle}>If False</label>
              <select
                style={inputStyle}
                value={config.false_action || 'skip'}
                onChange={e => setConfig({ ...config, false_action: e.target.value })}
              >
                <option value="continue">Continue to next step</option>
                <option value="skip">Skip next step</option>
                <option value="end">End workflow</option>
              </select>
            </>
          )}
          {step.step_type === 'ab_split' && (
            <>
              <label style={labelStyle}>Split A Percentage</label>
              <input
                type="number"
                min={1}
                max={99}
                style={inputStyle}
                value={config.split_a || 50}
                onChange={e => {
                  const a = Math.min(99, Math.max(1, parseInt(e.target.value) || 50));
                  setConfig({ ...config, split_a: a, split_b: 100 - a });
                }}
              />
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Variant A: {config.split_a || 50}% · Variant B: {config.split_b || 50}%
              </div>
              <label style={{ ...labelStyle, marginTop: 12 }}>Variant A Template</label>
              <input
                style={inputStyle}
                value={config.variant_a_template || ''}
                onChange={e => setConfig({ ...config, variant_a_template: e.target.value })}
                placeholder="Template name for variant A"
              />
              <label style={labelStyle}>Variant B Template</label>
              <input
                style={inputStyle}
                value={config.variant_b_template || ''}
                onChange={e => setConfig({ ...config, variant_b_template: e.target.value })}
                placeholder="Template name for variant B"
              />
            </>
          )}
          <button
            onClick={handleSave}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: '#0EA5E9',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Save Step
          </button>
        </div>
      )}

      <MetricsBar metrics={step.metrics} />
    </div>
  );
}

// ─── Builder View ───
function AutomationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [automation, setAutomation] = useState({
    name: '',
    description: '',
    trigger_type: 'signup',
    trigger_config: {},
    status: 'draft',
    steps: [],
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetch(`${API_BASE}/${id}`)
        .then(r => r.json())
        .then(d => setAutomation(d.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: automation.name,
            description: automation.description,
            trigger_type: automation.trigger_type,
            trigger_config: automation.trigger_config,
          }),
        });
        const data = await res.json();
        navigate(`/automations/${data.data.id}`, { replace: true });
      } else {
        await fetch(`${API_BASE}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: automation.name,
            description: automation.description,
            trigger_type: automation.trigger_type,
            trigger_config: automation.trigger_config,
          }),
        });
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  const handleActivate = async () => {
    const res = await fetch(`${API_BASE}/${id}/activate`, { method: 'POST' });
    const data = await res.json();
    setAutomation(prev => ({ ...prev, status: data.data.status }));
  };

  const handlePause = async () => {
    const res = await fetch(`${API_BASE}/${id}/pause`, { method: 'POST' });
    const data = await res.json();
    setAutomation(prev => ({ ...prev, status: data.data.status }));
  };

  const addStep = async (stepType) => {
    if (isNew) return;
    const res = await fetch(`${API_BASE}/${id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_type: stepType, config: getDefaultConfig(stepType) }),
    });
    const data = await res.json();
    setAutomation(prev => ({
      ...prev,
      steps: [...(prev.steps || []), { ...data.data, metrics: { sent: 0, opened: 0, clicked: 0, converted: 0 } }],
    }));
  };

  const updateStep = async (stepId, fields) => {
    const res = await fetch(`${API_BASE}/${id}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    setAutomation(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, ...data.data } : s),
    }));
  };

  const deleteStep = async (stepId) => {
    if (!confirm('Delete this step?')) return;
    await fetch(`${API_BASE}/${id}/steps/${stepId}`, { method: 'DELETE' });
    setAutomation(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId),
    }));
  };

  const moveStep = async (stepId, direction) => {
    const steps = [...(automation.steps || [])];
    const idx = steps.findIndex(s => s.id === stepId);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    // Swap positions
    const currentPos = steps[idx].position;
    const targetPos = steps[targetIdx].position;

    await updateStep(steps[idx].id, { position: targetPos });
    await updateStep(steps[targetIdx].id, { position: currentPos });

    // Swap in local state
    [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
    setAutomation(prev => ({ ...prev, steps }));
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  const steps = automation.steps || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('/automations')}
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 14 }}
        >
          ← Back to Automations
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!isNew && automation.status !== 'active' && (
            <button onClick={handleActivate} style={{ ...btnStyle, background: '#059669' }}>
              ▶ Activate
            </button>
          )}
          {!isNew && automation.status === 'active' && (
            <button onClick={handlePause} style={{ ...btnStyle, background: '#D97706' }}>
              ⏸ Pause
            </button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: '#0EA5E9' }}>
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {/* Status */}
      {!isNew && (
        <div style={{ marginBottom: 16 }}>
          <StatusBadge status={automation.status} />
        </div>
      )}

      {/* Basic Info */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, marginBottom: 24 }}>
        <label style={labelStyle}>Workflow Name</label>
        <input
          style={inputStyle}
          value={automation.name}
          onChange={e => setAutomation(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Welcome Series"
        />
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={automation.description}
          onChange={e => setAutomation(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What does this automation do?"
        />

        {/* Trigger */}
        <label style={{ ...labelStyle, marginTop: 16 }}>Trigger</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TRIGGER_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setAutomation(prev => ({ ...prev, trigger_type: t.value }))}
              style={{
                flex: '1 1 0',
                minWidth: 140,
                padding: '12px 16px',
                borderRadius: 8,
                border: automation.trigger_type === t.value ? '2px solid #0EA5E9' : '1px solid #E5E7EB',
                background: automation.trigger_type === t.value ? '#F0F9FF' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      {!isNew && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Workflow Steps ({steps.length})
          </h2>

          {/* Trigger node */}
          <div style={{
            textAlign: 'center',
            padding: '10px 0',
            marginBottom: 8,
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: '#EFF6FF',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              color: '#0EA5E9',
            }}>
              {TRIGGER_TYPES.find(t => t.value === automation.trigger_type)?.icon}{' '}
              Trigger: {TRIGGER_TYPES.find(t => t.value === automation.trigger_type)?.label}
            </div>
            {steps.length > 0 && (
              <div style={{ width: 2, height: 20, background: '#D1D5DB', margin: '0 auto' }} />
            )}
          </div>

          {/* Step cards with connectors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={step.id}>
                <StepCard
                  step={step}
                  index={i}
                  onUpdate={updateStep}
                  onDelete={deleteStep}
                  onMoveUp={(sid) => moveStep(sid, -1)}
                  onMoveDown={(sid) => moveStep(sid, 1)}
                  isFirst={i === 0}
                  isLast={i === steps.length - 1}
                />
                {i < steps.length - 1 && (
                  <div style={{ width: 2, height: 20, background: '#D1D5DB', margin: '0 auto' }} />
                )}
              </div>
            ))}
          </div>

          {/* Add step buttons */}
          <div style={{
            marginTop: steps.length > 0 ? 12 : 0,
            textAlign: 'center',
          }}>
            {steps.length > 0 && (
              <div style={{ width: 2, height: 20, background: '#D1D5DB', margin: '0 auto 12px' }} />
            )}
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 8 }}>Add a step:</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {STEP_TYPES.map(st => (
                <button
                  key={st.value}
                  onClick={() => addStep(st.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${st.color}40`,
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{st.icon}</span> {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* End node */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ width: 2, height: 20, background: '#D1D5DB', margin: '0 auto' }} />
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#F3F4F6',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: '#6B7280',
            }}>
              End of Workflow
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getDefaultConfig(stepType) {
  switch (stepType) {
    case 'email': return { template_name: '', subject: '' };
    case 'delay': return { duration: 1, unit: 'days' };
    case 'condition': return { condition_type: 'opened', true_action: 'continue', false_action: 'skip' };
    case 'ab_split': return { split_a: 50, split_b: 50, variant_a_template: '', variant_b_template: '' };
    default: return {};
  }
}

// ─── Shared styles ───
const btnStyle = {
  padding: '8px 16px',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
};

const iconBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  padding: '2px 6px',
  color: '#6B7280',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 4,
  marginTop: 12,
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #D1D5DB',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

// ─── Main component — routes between list and editor ───
export default function AutomationBuilder() {
  const { id } = useParams();
  const path = window.location.pathname;

  if (path === '/automations' || path === '/automations/') {
    return <AutomationList />;
  }
  return <AutomationEditor />;
}
