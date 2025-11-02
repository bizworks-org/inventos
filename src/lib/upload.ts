export function uploadWithProgress(url: string, file: File, fields: Record<string, string> = {}, onProgress?: (pct: number) => void) {
  const xhr = new XMLHttpRequest();
  const fd = new FormData();
  fd.append('file', file);
  for (const k of Object.keys(fields)) fd.append(k, fields[k]);

  const promise = new Promise<any>((resolve, reject) => {
    try {
      xhr.open('POST', url);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && typeof onProgress === 'function') {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          onProgress(pct);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); } catch (e) { resolve(xhr.responseText); }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload error'));
      xhr.send(fd);
    } catch (err) { reject(err); }
  });

  return {
    promise,
    abort: () => {
      try { xhr.abort(); } catch (e) { /* ignore */ }
    }
  };
}
