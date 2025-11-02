import React, { useRef, useState } from 'react';

interface FileDropzoneProps {
  id?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  files?: File[];
  hint?: string;
  onFilesAdded?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  /**
   * Optional upload handler. If provided, the dropzone will call this for each file
   * and report upload progress (0-100) via the progress callback.
   */
  uploadFile?: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  /**
   * Optional external progress map keyed by file key (name-size-lastModified) to display progress
   * for uploads driven outside the dropzone (e.g. queued uploads from parent).
   */
  externalProgress?: Record<string, number>;
  /** Render a compact variation with reduced padding and smaller file rows */
  compact?: boolean;
}

export default function FileDropzone({ id, accept, multiple = false, maxSizeMB = 25, files = [], hint, onFilesAdded, onRemove, uploadFile, externalProgress, compact = false }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  // track progress per file key
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const keyFor = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList).filter(f => (f.size / 1024 / 1024) <= maxSizeMB);
    if (arr.length && onFilesAdded) onFilesAdded(arr);

    // Start uploads if uploadFile provided
    if (uploadFile) {
      arr.forEach((file) => {
        const k = keyFor(file);
        // initialize
        setProgressMap((p) => ({ ...p, [k]: 0 }));
        // call upload handler
        uploadFile(file, (pct) => {
          setProgressMap((p) => ({ ...p, [k]: Math.round(pct) }));
        }).then(() => {
          setProgressMap((p) => ({ ...p, [k]: 100 }));
        }).catch(() => {
          setProgressMap((p) => ({ ...p, [k]: 0 }));
        });
      });
    }
  };

  return (
    <div>
      <div
        id={id}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer?.files ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { inputRef.current?.click(); } }}
        className={`rounded-lg border-2 border-dashed ${compact ? 'p-3' : 'p-6'} text-center cursor-pointer transition-all duration-150 ${dragging ? 'border-[#6366f1] bg-white' : 'border-[rgba(0,0,0,0.06)] bg-white'}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`${compact ? 'h-8 w-8' : 'h-12 w-12'} rounded-lg bg-[#f1f5ff] flex items-center justify-center`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#6366f1]">
              <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M7 10L12 5L17 10" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M12 5V17" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} text-[#1a1d2e] font-medium`}>Drop your files here or <span className="text-[#6366f1] underline">browse</span></div>
          <div className={`${compact ? 'text-2xs text-[#94a3b8]' : 'text-xs text-[#94a3b8]'}`}>{hint ?? `Max. File Size: ${maxSizeMB} MB`}</div>
        </div>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => { handleFiles(e.target.files); (e.target as HTMLInputElement).value = ''; }} />
      </div>

      <div className={`${compact ? 'mt-2 space-y-2' : 'mt-3 space-y-3'}`}>
        {files.length === 0 && <div className={`${compact ? 'text-xs' : 'text-sm'} text-[#94a3b8]`}>No files selected</div>}
        {files.map((f, idx) => {
          const k = keyFor(f);
            const pct = progressMap[k] ?? (externalProgress && externalProgress[k]) ?? 0;
          return (
            <div key={`${f.name}-${idx}`} className={`${compact ? 'bg-white p-2' : 'bg-white p-3'} rounded-lg flex items-center justify-between shadow-sm`}>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className={`${compact ? 'text-sm' : 'text-sm'} font-medium text-[#1a1d2e]`}>{f.name}</div>
                  <div className={`${compact ? 'text-2xs' : 'text-xs'} text-[#94a3b8]`}>{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className={`${compact ? 'mt-1' : 'mt-2'}`}>
                  <div className={`${compact ? 'w-full bg-[#eef2ff] h-1 rounded-full overflow-hidden' : 'w-full bg-[#eef2ff] h-2 rounded-full overflow-hidden'}`}>
                    <div className={`${compact ? 'h-1' : 'h-2'} rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`${compact ? 'text-2xs' : 'text-xs'} text-[#64748b] mt-1`}>{pct}%</div>
                </div>
              </div>
              <div className={`flex items-center gap-2 ml-4 ${compact ? 'ml-2' : ''}`}>
                <button type="button" title="Pause" className={`${compact ? 'p-1' : 'p-2'} rounded-md bg-white border border-[rgba(0,0,0,0.06)] text-[#64748b]`}>⏸</button>
                <button type="button" title="Remove" onClick={() => onRemove?.(idx)} className={`${compact ? 'p-1' : 'p-2'} rounded-md bg-red-50 text-red-700 border border-[rgba(0,0,0,0.06)]`}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
