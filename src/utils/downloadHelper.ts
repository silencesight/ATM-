export async function triggerDownload(fileName: string, content: string, fileType: 'json' | 'csv' = 'json') {
  // @ts-ignore
  if (window.__TAURI_INTERNALS__) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      
      const filePath = await save({
        filters: [{ name: fileType.toUpperCase(), extensions: [fileType] }],
        defaultPath: fileName,
      });

      if (filePath) {
        await writeTextFile(filePath, content);
      }
      return;
    } catch (e) {
      console.error('Tauri download failed', e);
    }
  }

  const blob = new Blob([content], { 
    type: fileType === 'json' ? 'application/json' : 'text/csv;charset=utf-8;' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
