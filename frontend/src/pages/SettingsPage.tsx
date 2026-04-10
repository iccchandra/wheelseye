import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsApi } from '../services/api';

type Tab = 'general' | 'smtp' | 'templates';

export const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('general');
  const qc = useQueryClient();

  const { data: allSettings } = useQuery('settings', settingsApi.getAll);
  const { data: templatesData } = useQuery('email-templates', settingsApi.getTemplates, { enabled: tab === 'templates' });

  const settings = allSettings?.data || {};
  const templates = templatesData?.data || [];

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 16 }}>Settings</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['general', 'smtp', 'templates'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', background: tab === t ? '#185FA5' : 'var(--bg-primary)', color: tab === t ? '#fff' : 'var(--text-secondary)', border: `0.5px solid ${tab === t ? '#185FA5' : 'var(--border)'}` }}>
            {t === 'general' ? 'General' : t === 'smtp' ? 'SMTP / Email' : 'Email Templates'}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralSettings settings={settings} qc={qc} />}
      {tab === 'smtp' && <SmtpSettings settings={settings} qc={qc} />}
      {tab === 'templates' && <TemplateSettings templates={templates} qc={qc} />}
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' };

const GeneralSettings: React.FC<{ settings: Record<string, string>; qc: any }> = ({ settings, qc }) => {
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { setForm(settings); }, [settings]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation(
    () => settingsApi.bulkSet(Object.entries(form).map(([key, value]) => ({ key, value, group: 'general' }))),
    { onSuccess: () => qc.invalidateQueries('settings') },
  );

  const fields = [
    { key: 'company_name', label: 'Company Name' },
    { key: 'company_address', label: 'Address' },
    { key: 'invoice_prefix', label: 'Invoice Prefix' },
    { key: 'currency_prefix', label: 'Currency Prefix' },
    { key: 'invoice_service_name', label: 'Invoice Service Name' },
    { key: 'logo_url', label: 'Logo URL' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input style={inputStyle} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle}>Invoice Terms &amp; Conditions</label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.invoice_terms || ''} onChange={e => set('invoice_terms', e.target.value)} />
      </div>
      <button onClick={() => save.mutate()} style={{ marginTop: 14, padding: '8px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
        {save.isLoading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
};

const SmtpSettings: React.FC<{ settings: Record<string, string>; qc: any }> = ({ settings, qc }) => {
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { setForm(settings); }, [settings]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = useMutation(
    () => settingsApi.bulkSet(Object.entries(form).filter(([k]) => k.startsWith('smtp_')).map(([key, value]) => ({ key, value, group: 'smtp' }))),
    { onSuccess: () => qc.invalidateQueries('settings') },
  );

  const fields = [
    { key: 'smtp_host', label: 'SMTP Host' },
    { key: 'smtp_port', label: 'Port' },
    { key: 'smtp_username', label: 'Username' },
    { key: 'smtp_password', label: 'Password', type: 'password' },
    { key: 'smtp_from_email', label: 'From Email' },
    { key: 'smtp_reply_to', label: 'Reply-To' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input style={inputStyle} type={f.type || 'text'} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div>
          <label style={labelStyle}>Security</label>
          <select style={inputStyle} value={form['smtp_security'] || ''} onChange={e => set('smtp_security', e.target.value)}>
            <option value="">Select...</option>
            <option value="SSL">SSL</option>
            <option value="TLS">TLS</option>
            <option value="NONE">None</option>
          </select>
        </div>
      </div>
      <button onClick={() => save.mutate()} style={{ marginTop: 14, padding: '8px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
        {save.isLoading ? 'Saving...' : 'Save SMTP Config'}
      </button>
    </div>
  );
};

const TemplateSettings: React.FC<{ templates: any[]; qc: any }> = ({ templates, qc }) => {
  const [editing, setEditing] = useState<any>(null);

  const updateMut = useMutation(
    (data: { id: string; name: string; subject: string; body: string }) => settingsApi.updateTemplate(data.id, { name: data.name, subject: data.subject, body: data.body }),
    { onSuccess: () => { qc.invalidateQueries('email-templates'); setEditing(null); } },
  );

  if (editing) {
    return (
      <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Edit: {editing.name}</div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Subject</label>
          <input style={inputStyle} value={editing.subject || ''} onChange={e => setEditing({ ...editing, subject: e.target.value })} placeholder="Use {{company_name}}, {{invoice_number}}, etc." />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Body (HTML)</label>
          <textarea style={{ ...inputStyle, minHeight: 200, fontFamily: 'monospace', fontSize: 12 }} value={editing.body || ''} onChange={e => setEditing({ ...editing, body: e.target.value })} placeholder="Placeholders: {{company_name}}, {{customer_name}}, {{invoice_number}}, {{amount}}, {{due_date}}, {{tracking_url}}" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => updateMut.mutate(editing)} style={{ padding: '8px 20px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>
            {updateMut.isLoading ? 'Saving...' : 'Save Template'}
          </button>
          <button onClick={() => setEditing(null)} style={{ padding: '8px 20px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '0.5px solid var(--border)', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)' }}>
            {['Name', 'Subject', 'Actions'].map(h => (
              <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '0.5px solid var(--border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {templates.length === 0 && <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No templates yet</td></tr>}
          {templates.map((t: any) => (
            <tr key={t.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{t.name}</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{t.subject || '—'}</td>
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => setEditing(t)} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
