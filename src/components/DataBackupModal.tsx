import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  Save,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Copy,
  FolderCheck,
} from 'lucide-react';
import {
  Student,
  Loan,
  StoreItem,
  TeacherSettings,
  Classroom,
  PendingStudentRequest,
} from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  loans: Loan[];
  storeItems: StoreItem[];
  classrooms?: Classroom[];
  pendingRequests?: PendingStudentRequest[];
  settings: TeacherSettings;
  onRestoreBackup: (data: {
    students: Student[];
    loans: Loan[];
    storeItems?: StoreItem[];
    classrooms?: Classroom[];
    pendingRequests?: PendingStudentRequest[];
    settings?: TeacherSettings;
  }) => void;
  onSaveManualSnapshot: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  students,
  loans,
  storeItems,
  classrooms = [],
  pendingRequests = [],
  settings,
  onRestoreBackup,
  onSaveManualSnapshot,
}) => {
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');
  const [snapshotSavedNotice, setSnapshotSavedNotice] = useState(false);
  const [copiedJsonNotice, setCopiedJsonNotice] = useState(false);
  const [savedLocalSnapshotInfo, setSavedLocalSnapshotInfo] = useState<{
    timestamp: string;
    studentsCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshLocalSnapshotInfo = () => {
    try {
      const raw = localStorage.getItem('esl_classroom_emergency_snapshot');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students)) {
          setSavedLocalSnapshotInfo({
            timestamp: parsed.timestamp || new Date().toISOString(),
            studentsCount: parsed.students.length,
          });
          return;
        }
      }
    } catch {
      // ignore
    }
    setSavedLocalSnapshotInfo(null);
  };

  useEffect(() => {
    if (isOpen) {
      refreshLocalSnapshotInfo();
      setExportSuccessMessage('');
      setRestoreStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalRisesCount = students.reduce(
    (acc, s) => acc + (s.creditLimitRaisesHistory || []).length,
    0
  );
  const totalRewardsCount = students.reduce(
    (acc, s) => acc + (s.englishRewardsHistory || []).length,
    0
  );

  // Generate complete backup payload (v4.0.0)
  const createBackupPayload = () => {
    return {
      version: '4.0.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        studentsCount: students.length,
        loansCount: loans.length,
        classroomsCount: classrooms.length,
        risesCount: totalRisesCount,
        rewardsCount: totalRewardsCount,
      },
      data: {
        students,
        loans,
        storeItems,
        classrooms,
        pendingRequests,
        settings,
      },
    };
  };

  // Download & Save backup JSON file (Supports Tauri Desktop App + Native Windows File Picker + Browser Download)
  const handleExportBackup = async () => {
    setExportSuccessMessage('');
    const payload = createBackupPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const defaultFilename = `ATM_4.0_Backup_${dateStr}.json`;

    let savedViaTauriPath = '';

    // 1. If running in ATM 4.0 Desktop App (Tauri), save directly to SNAPSHOT folder via Rust backend
    const isTauri =
      typeof window !== 'undefined' &&
      ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const resultPath = await invoke<string>('autosave_backup', {
          content: jsonString,
          filename: defaultFilename,
        });
        if (resultPath) {
          savedViaTauriPath = resultPath;
        }
      } catch {
        // Fallback if older Tauri binary signature only takes { content }
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('autosave_backup', { content: jsonString });
          savedViaTauriPath = 'SNAPSHOT\\autosave.json';
        } catch {
          // ignore and continue to file picker/blob fallback
        }
      }
    }

    // 2. Try Native Windows "Save As..." File Picker (supported in Edge, Chrome, and WebView2)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (
          window as unknown as {
            showSaveFilePicker: (opts: unknown) => Promise<{
              createWritable: () => Promise<{
                write: (data: string) => Promise<void>;
                close: () => Promise<void>;
              }>;
              name?: string;
            }>;
          }
        ).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [
            {
              description: 'ATM 4.0 JSON Backup File',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        setExportSuccessMessage(
          `Backup saved successfully as "${handle.name || defaultFilename}"!${
            savedViaTauriPath ? ` (Also auto-saved to ${savedViaTauriPath})` : ''
          }`
        );
        return;
      } catch (err) {
        // If user cancelled the Save As dialog, stop unless Tauri already saved it
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (savedViaTauriPath) {
            setExportSuccessMessage(`Backup auto-saved to ${savedViaTauriPath}!`);
          }
          return;
        }
      }
    }

    // 3. Standard Browser Blob Download Fallback
    try {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);

      setExportSuccessMessage(
        savedViaTauriPath
          ? `Backup saved to ${savedViaTauriPath} and downloaded as ${defaultFilename}!`
          : `Downloaded "${defaultFilename}" to your Downloads folder!`
      );
    } catch {
      if (savedViaTauriPath) {
        setExportSuccessMessage(`Backup saved directly to ${savedViaTauriPath}!`);
      }
    }
  };

  // Copy JSON to clipboard as an additional instant backup option
  const handleCopyBackupJson = async () => {
    const payload = createBackupPayload();
    const jsonString = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiedJsonNotice(true);
      setTimeout(() => setCopiedJsonNotice(false), 3000);
    } catch {
      // ignore
    }
  };

  // Save manual snapshot to local storage
  const handleTriggerSnapshot = () => {
    onSaveManualSnapshot();
    refreshLocalSnapshotInfo();
    setSnapshotSavedNotice(true);
    setTimeout(() => setSnapshotSavedNotice(false), 3000);
  };

  // Restore directly from saved local storage snapshot
  const handleRestoreFromLocalSnapshot = () => {
    try {
      const raw = localStorage.getItem('esl_classroom_emergency_snapshot');
      if (!raw) {
        setRestoreStatus('error');
        setErrorMessage('No local snapshot found in browser storage.');
        return;
      }
      const parsed = JSON.parse(raw);
      const targetData = parsed.data || parsed;
      if (!Array.isArray(targetData.students) || !Array.isArray(targetData.loans)) {
        throw new Error('Local snapshot is missing student or loan records.');
      }

      onRestoreBackup({
        students: targetData.students,
        loans: targetData.loans,
        storeItems: targetData.storeCatalog || targetData.storeItems,
        classrooms: targetData.classrooms,
        pendingRequests: targetData.pendingRequests,
        settings: targetData.settings,
      });

      setRestoreStatus('success');
      setTimeout(() => {
        setRestoreStatus('idle');
        onClose();
      }, 1500);
    } catch (err) {
      setRestoreStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to restore local snapshot.'
      );
    }
  };

  // Handle file restore upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Support both direct data structures and wrapped backup format
        const targetData = parsed.data || parsed;

        if (!Array.isArray(targetData.students) || !Array.isArray(targetData.loans)) {
          throw new Error('Invalid backup file: missing students or loans collections.');
        }

        onRestoreBackup({
          students: targetData.students,
          loans: targetData.loans,
          storeItems: targetData.storeItems || targetData.storeCatalog,
          classrooms: targetData.classrooms,
          pendingRequests: targetData.pendingRequests,
          settings: targetData.settings,
        });

        setRestoreStatus('success');
        setTimeout(() => {
          setRestoreStatus('idle');
          onClose();
        }, 1800);
      } catch (err) {
        setRestoreStatus('error');
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to parse JSON file. Please ensure it is a valid backup file.'
        );
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-panel specular-edge rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col text-on-surface">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider font-headline">
                  Save &amp; Export Progress (ATM 4.0)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 text-primary-container font-mono text-[10px] font-bold">
                  Data Protection
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Safeguard all student accounts, classrooms, loans, store items, and history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl glass-pill transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Current Backup Inventory KPI */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">
                Current App State Ready for Backup
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Ready for export
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] uppercase text-slate-500 block">Students</span>
                <span className="text-base font-bold text-white">{students.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] uppercase text-slate-500 block">Loans</span>
                <span className="text-base font-bold text-teal-400">{loans.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] uppercase text-slate-500 block">Rises Logged</span>
                <span className="text-base font-bold text-emerald-400">{totalRisesCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] uppercase text-slate-500 block">Rewards Logged</span>
                <span className="text-base font-bold text-cyan-400">{totalRewardsCount}</span>
              </div>
            </div>
          </div>

          {/* Option 1: Export to File */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-950 border border-blue-500/30 text-blue-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Download Full Backup File (.json)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Opens a Save dialog to store a complete JSON archive of all students, classes, balances, loans, and settings on your computer.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Save &amp; Export Backup (.json)
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBackupJson}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    {copiedJsonNotice ? 'Copied JSON!' : 'Copy JSON'}
                  </button>
                </div>

                {exportSuccessMessage && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Option 2: Quick Local Snapshot */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Save className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Instant Local Recovery Snapshot
                  </h4>
                  {snapshotSavedNotice && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Snapshot Saved!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pins an emergency recovery checkpoint inside the app so you can restore it in one click at any time.
                </p>

                {savedLocalSnapshotInfo && (
                  <p className="text-[11px] font-mono text-emerald-400/90 mt-1.5">
                    Last Saved Checkpoint: {new Date(savedLocalSnapshotInfo.timestamp).toLocaleString()} ({savedLocalSnapshotInfo.studentsCount} students)
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTriggerSnapshot}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    Save Local Snapshot
                  </button>

                  {savedLocalSnapshotInfo && (
                    <button
                      type="button"
                      onClick={handleRestoreFromLocalSnapshot}
                      className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-500/40 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Local Snapshot
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Option 3: Restore / Import */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-950 border border-amber-500/30 text-amber-400 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Restore Progress from Backup File (.json)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Load any saved JSON backup file from your computer to restore all students, classes, balances, and loans.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />

                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 border border-amber-500/30 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Upload &amp; Restore Backup (.json)
                  </button>
                </div>

                {restoreStatus === 'success' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Backup restored successfully! Updating database...</span>
                  </div>
                )}

                {restoreStatus === 'error' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Auto-save active in local storage on every transaction
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
