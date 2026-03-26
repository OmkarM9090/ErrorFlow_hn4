import React, { useMemo, useState } from 'react';
import { Globe, Search, ArrowLeft } from 'lucide-react';

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function AuditUrlPrompt({
  initialUrl,
  title,
  subtitle,
  submitLabel = 'Run Audit',
  onSubmit,
  onCancel,
  compact = false,
}) {
  const [url, setUrl] = useState(initialUrl || '');
  const [standard, setStandard] = useState('WCAG2AA');
  const [error, setError] = useState('');

  const normalizedUrl = useMemo(() => url.trim(), [url]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!normalizedUrl) {
      setError('Please enter a target URL.');
      return;
    }

    if (!isValidHttpUrl(normalizedUrl)) {
      setError('Enter a valid URL starting with http:// or https://');
      return;
    }

    setError('');
    if (typeof onSubmit === 'function') {
      onSubmit(normalizedUrl, standard);
    }
  };

  return (
    <div className={`w-full ${compact ? 'max-w-2xl' : 'max-w-3xl'} mx-auto rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8 shadow-[0_16px_50px_rgba(15,23,42,0.08)]`}>
      <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
        <Search size={14} />
        Target Scanner
      </p>

      <h2 className="font-serif text-3xl text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-600">{subtitle}</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="audit-url-input">
          Website URL
        </label>

        <div className="relative">
          <Globe size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="audit-url-input"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Standard</label>
              <select 
                value={standard} 
                onChange={(e) => setStandard(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-indigo-500 outline-none"
              >
                <option value="WCAG2AA">WCAG 2.1 AA (Default)</option>
                <option value="WCAG2AAA">WCAG 2.1 AAA (Strict)</option>
                <option value="SECTION508">Section 508</option>
                <option value="EN301549">EN 301 549</option>
              </select>
           </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20"
          >
            <Search size={16} />
            {submitLabel}
          </button>

          {typeof onCancel === 'function' ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              <ArrowLeft size={16} />
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}