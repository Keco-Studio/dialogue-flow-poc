'use client';

import { useCallback, useRef, useState } from 'react';
import { exportProject } from '@/services/serializer';
import { importProject } from '@/services/importer';
import { useProjectStore } from '@/stores/projectStore';

export default function ExportImportButtons() {
  const projectName = useProjectStore((s) => s.name);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    try {
      const json = exportProject();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'project'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setError(null);
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [projectName]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProject(reader.result as string);
        setError(null);
      } catch (err) {
        setError(`Import failed: ${err instanceof Error ? err.message : 'Invalid file'}`);
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be selected again
    e.target.value = '';
  }, []);

  return (
    <div className="export-import-buttons">
      <button onClick={handleExport} className="toolbar-btn">
        Export
      </button>
      <button onClick={handleImport} className="toolbar-btn">
        Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {error && <span className="toolbar-error">{error}</span>}
    </div>
  );
}
