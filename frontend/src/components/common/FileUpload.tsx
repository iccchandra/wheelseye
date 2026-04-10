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
      <label className="form-label">{label}</label>
      <div className="flex gap-1.5 items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`btn-secondary btn-sm ${uploading ? 'cursor-wait' : ''}`}
        >
          {uploading ? 'Uploading...' : value ? 'Change file' : 'Choose file'}
        </button>
        {value && (
          <>
            <a href={value} target="_blank" rel="noreferrer" className="text-[11px] text-brand-600 underline hover:text-brand-700">View</a>
            <button type="button" onClick={() => onChange('')} className="text-[11px] text-red-500 bg-transparent border-none cursor-pointer underline hover:text-red-600">Remove</button>
          </>
        )}
        {value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value) && (
          <img src={value} alt="" className="w-8 h-8 rounded object-cover border border-slate-200" />
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
};
