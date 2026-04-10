import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsApi } from '../services/api';
import { Settings, Mail, FileText, Pencil } from 'lucide-react';

type Tab = 'general' | 'smtp' | 'templates';

const TAB_META: Record<Tab, { label: string; icon: React.ReactNode }> = {
  general: { label: 'General', icon: <Settings size={14} /> },
  smtp: { label: 'SMTP / Email', icon: <Mail size={14} /> },
  templates: { label: 'Email Templates', icon: <FileText size={14} /> },
};

export const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('general');
  const qc = useQueryClient();

  const { data: allSettings } = useQuery('settings', settingsApi.getAll);
  const { data: templatesData } = useQuery('email-templates', settingsApi.getTemplates, { enabled: tab === 'templates' });

  const settings = allSettings?.data || {};
  const templates = templatesData?.data || [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="flex gap-1.5 mb-4">
        {(['general', 'smtp', 'templates'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn-sm inline-flex items-center gap-1.5 rounded-lg border cursor-pointer transition-colors ${
              tab === t
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {TAB_META[t].icon}
            {TAB_META[t].label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralSettings settings={settings} qc={qc} />}
      {tab === 'smtp' && <SmtpSettings settings={settings} qc={qc} />}
      {tab === 'templates' && <TemplateSettings templates={templates} qc={qc} />}
    </div>
  );
};

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
    <div className="form-section">
      <div className="form-grid grid-cols-2">
        {fields.map(f => (
          <div key={f.key}>
            <label className="form-label">{f.label}</label>
            <input className="input" value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="mt-3.5">
        <label className="form-label">Invoice Terms &amp; Conditions</label>
        <textarea className="input min-h-[80px] resize-y" value={form.invoice_terms || ''} onChange={e => set('invoice_terms', e.target.value)} />
      </div>
      <button onClick={() => save.mutate()} className="btn-primary mt-3.5">
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
    <div className="form-section">
      <div className="form-grid grid-cols-2">
        {fields.map(f => (
          <div key={f.key}>
            <label className="form-label">{f.label}</label>
            <input className="input" type={f.type || 'text'} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div>
          <label className="form-label">Security</label>
          <select className="select" value={form['smtp_security'] || ''} onChange={e => set('smtp_security', e.target.value)}>
            <option value="">Select...</option>
            <option value="SSL">SSL</option>
            <option value="TLS">TLS</option>
            <option value="NONE">None</option>
          </select>
        </div>
      </div>
      <button onClick={() => save.mutate()} className="btn-primary mt-3.5">
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
      <div className="form-section">
        <div className="text-sm font-semibold mb-3">Edit: {editing.name}</div>
        <div className="mb-2.5">
          <label className="form-label">Name</label>
          <input className="input" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
        </div>
        <div className="mb-2.5">
          <label className="form-label">Subject</label>
          <input className="input" value={editing.subject || ''} onChange={e => setEditing({ ...editing, subject: e.target.value })} placeholder="Use {{company_name}}, {{invoice_number}}, etc." />
        </div>
        <div className="mb-2.5">
          <label className="form-label">Body (HTML)</label>
          <textarea className="input min-h-[200px] font-mono text-xs" value={editing.body || ''} onChange={e => setEditing({ ...editing, body: e.target.value })} placeholder="Placeholders: {{company_name}}, {{customer_name}}, {{invoice_number}}, {{amount}}, {{due_date}}, {{tracking_url}}" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateMut.mutate(editing)} className="btn-primary">
            {updateMut.isLoading ? 'Saving...' : 'Save Template'}
          </button>
          <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {['Name', 'Subject', 'Actions'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {templates.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-slate-400 text-sm py-6">No templates yet</td>
            </tr>
          )}
          {templates.map((t: any) => (
            <tr key={t.id}>
              <td className="font-medium">{t.name}</td>
              <td className="text-xs text-slate-500">{t.subject || '—'}</td>
              <td>
                <button onClick={() => setEditing(t)} className="btn-ghost btn-sm inline-flex items-center gap-1">
                  <Pencil size={12} />
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
