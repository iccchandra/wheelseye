import React, { useRef, useState } from 'react';
import { uploadApi } from '../../services/api';

interface Props {
  label: string;
  value?: string;
  category?: string;
  accept?: string;
  onChange: (url: string) => void;
}

export const FileUpload: React.FC<Props> = ({ label, value, category, accept = 'image/*,.pdf', onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file, category);
      onChange(res.data.url);
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, border: '0.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: uploading ? 'wait' : 'pointer' }}
        >
          {uploading ? 'Uploading...' : value ? 'Change file' : 'Choose file'}
        </button>
        {value && (
          <>
            <a href={value} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#185FA5', textDecoration: 'underline' }}>View</a>
            <button type="button" onClick={() => onChange('')} style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
          </>
        )}
        {value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value) && (
          <img src={value} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', border: '0.5px solid var(--border)' }} />
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
};
