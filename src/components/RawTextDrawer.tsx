import { ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import type { AppLanguage } from '../utils/i18n';
import { getExtendedMessages } from '../utils/i18nExtended';

interface RawTextDrawerProps {
  lang: AppLanguage;
  rawText: string;
  officialUrl?: string;
}

export function RawTextDrawer({ lang, rawText, officialUrl }: RawTextDrawerProps) {
  const [open, setOpen] = useState(false);
  const ext = getExtendedMessages(lang);

  if (!rawText && !officialUrl) return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {rawText && (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:border-[var(--nein-accent-border)] hover:text-[var(--nein-accent-text)] dark:text-slate-300 cursor-pointer"
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
            <span>{open ? ext.common.hideRawBtn : ext.common.rawJapaneseBtn}</span>
          </button>
        )}
        {officialUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2 py-0.5 text-[11px] font-medium text-[var(--nein-accent-text)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span>{ext.common.openOfficialSite}</span>
          </a>
        )}
      </div>
      {open && rawText && (
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] p-2.5 font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
          {rawText}
        </pre>
      )}
    </div>
  );
}
