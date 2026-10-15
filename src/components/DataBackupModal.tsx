import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  Save,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  RotateCcw,
} from 'lucide-react';
import { Student, Loan, StoreItem, TeacherSettings } from '../types';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  loans: Loan[];
  storeItems: StoreItem[];
  settings: TeacherSettings;
  onRestoreBackup: (data: {
    students: Student[];
    loans: Loan[];
    storeItems?: StoreItem[];
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
  settings,
  onRestoreBackup,
  onSaveManualSnapshot,
}) => {
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [snapshotSavedNotice, setSnapshotSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalRisesCount = students.reduce(
    (acc, s) => acc + (s.creditLimitRaisesHistory || []).length,
    0
  );
  const totalRewardsCount = students.reduce(
    (acc, s) => acc + (s.englishRewardsHistory || []).length,
    0
  );

  // Generate complete backup payload
  const createBackupPayload = () => {
    return {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        studentsCount: students.length,
        loansCount: loans.length,
        risesCount: totalRisesCount,
        rewardsCount: totalRewardsCount,
      },
      data: {
        students,
        loans,
        storeItems,
        settings,
      },
    };
  };

  // Download backup JSON file
  const handleExportBackup = () => {
    const payload = createBackupPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `student_credit_app_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save manual snapshot to local storage
  const handleTriggerSnapshot = () => {
    onSaveManualSnapshot();
    setSnapshotSavedNotice(true);
    setTimeout(() => setSnapshotSavedNotice(false), 3000);
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
          storeItems: targetData.storeItems,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Save &amp; Export Progress
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
                  Data Protection
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Safeguard all student accounts, loans, credit limit rises, and history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
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
                Current App State to be Saved
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
                  Downloads a secure JSON archive containing 100% of student balances, credit histories, loans, and settings to your computer.
                </p>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" />
                  Save &amp; Export Backup (.json)
                </button>
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
                    Instant Browser Storage Snapshot
                  </h4>
                  {snapshotSavedNotice && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Snapshot Saved!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pins the current progress directly into persistent browser storage so you can refresh or restart without losing data.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerSnapshot}
                  className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  Save Local Progress Snapshot
                </button>
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
                  Restore Progress from Backup File
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  If the browser was cleared or you need to recover an earlier state, load your saved JSON backup file.
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
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 border border-amber-500/30"
                  >
                    <Upload className="w-4 h-4" />
                    Upload &amp; Restore Backup
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
