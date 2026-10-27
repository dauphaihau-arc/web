/**
 * Saves the export response as a file. The API already sets the intended
 * filename and content type, but the client keeps its own copy so the download
 * name stays stable regardless of proxy headers.
 */
export function downloadAuditCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'audit-logs.csv';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
