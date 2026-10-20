import React, { useState } from 'react';
import {
  X,
  Globe,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Wifi,
  Users,
  Smartphone,
  Database,
  KeyRound,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TeacherSettings } from '../types';
import {
  SUPABASE_SETUP_SQL,
  getConfiguredCloudDbUrl,
  getConfiguredSupabaseKey,
  normalizeSupabaseKey,
  normalizeSupabaseUrl,
  saveConfiguredCloudDbUrl,
} from '../services/cloudSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TeacherSettings;
  onUpdateSettings: (newSettings: TeacherSettings) => void;
  onForcePushToCloud: (
    dbUrl: string,
    supabaseKey?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onOpenStudentWebPreview: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onForcePushToCloud,
  onOpenStudentWebPreview,
}) => {
  const [dbUrlInput, setDbUrlInput] = useState<string>(
    () => settings.cloudDatabaseUrl || getConfiguredCloudDbUrl() || ''
  );
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(
    () => settings.cloudSupabaseKey || getConfiguredSupabaseKey() || ''
  );
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  if (!isOpen) return null;

  const normalizedDbUrl = normalizeSupabaseUrl(dbUrlInput);
  const normalizedAnonKey = normalizeSupabaseKey(supabaseKeyInput);
  const publicBaseUrl = 'https://silencesight.github.io/ATM-/';
  const studentShareUrl =
    normalizedDbUrl && normalizedAnonKey
      ? `${publicBaseUrl}?portal=student&db=${encodeURIComponent(normalizedDbUrl)}&key=${encodeURIComponent(normalizedAnonKey)}`
      : normalizedDbUrl
      ? `${publicBaseUrl}?portal=student&db=${encodeURIComponent(normalizedDbUrl)}`
      : `${publicBaseUrl}?portal=student`;

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = saveConfiguredCloudDbUrl(dbUrlInput, supabaseKeyInput);
    const cleanKey = normalizeSupabaseKey(supabaseKeyInput);
    const updatedSettings: TeacherSettings = {
      ...settings,
      cloudDatabaseUrl: cleanUrl,
      cloudSupabaseKey: cleanKey,
    };
    onUpdateSettings(updatedSettings);

    if (!cleanUrl) {
      setSyncStatus('success');
      setStatusMessage(
        'Saved! Running in Local Sync mode (works across browser tabs on this computer).'
      );
      return;
    }

    if (!cleanKey) {
      setSyncStatus('error');
      setStatusMessage(
        'Please paste your Supabase Anon / Publishable API Key so ATM 4.0 can authenticate with your Supabase database.'
      );
      return;
    }

    setSyncStatus('syncing');
    setStatusMessage('Connecting to Supabase and pushing classroom roster to cloud...');
    const res = await onForcePushToCloud(cleanUrl, cleanKey);
    if (res.ok) {
      setSyncStatus('success');
      setStatusMessage(
        'Connected to Supabase! Your classroom roster, loans, and store are now live in real time.'
      );
    } else {
      setSyncStatus('error');
      setStatusMessage(
        res.error ||
          'Could not connect to Supabase. Verify your Project URL, Anon Key, and make sure you ran the SQL Setup Script.'
      );
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(studentShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-primary-container/35 shadow-2xl specular-edge p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-headline font-extrabold text-on-surface flex items-center gap-2">
                Supabase Real-Time Cloud Sync
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PostgreSQL + WebSockets
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Connect ATM 4.0 to your free Supabase database for instant, high-capacity Student Web App sync.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl glass-pill text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instant Interactive Preview Card */}
        <div className="glass-well rounded-2xl p-4 border border-tertiary-container/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-6 h-6 text-tertiary-fixed-dim shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-headline font-bold text-on-surface">
                Test the Student Web App Right Now!
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Launch the live Student Web App view to log in with any student&apos;s{' '}
                <strong>FULL NAME IN CAPS</strong> + <strong>3-digit Card CVV</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenStudentWebPreview();
            }}
            className="liquid-button-primary px-4 py-2.5 rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Open Student Web App
          </button>
        </div>

        {/* 1-Click Supabase SQL Setup Card */}
        <div className="glass-well rounded-2xl p-4 border border-emerald-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                One-Time Supabase Table Setup (Takes 30 Seconds)
              </h3>
              <p className="text-[11px] font-mono text-on-surface-variant leading-relaxed">
                1. Go to <span className="text-emerald-300 font-bold">supabase.com</span> &rarr; Create a free project.
                <br />
                2. Open <strong>SQL Editor</strong> &rarr; Click <strong>Copy SQL Setup Script</strong> below &rarr; Paste &amp; click <strong>Run</strong>.
                <br />
                3. Go to <strong>Project Settings &rarr; API</strong> &rarr; Copy your <strong>Project URL</strong> &amp; <strong>anon public key</strong> below!
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedSql ? 'SQL Copied!' : 'Copy SQL Setup Script'}
              </button>
              <button
                type="button"
                onClick={() => setShowSqlPreview((prev) => !prev)}
                className="p-2 rounded-xl glass-pill text-on-surface-variant hover:text-on-surface text-xs font-mono cursor-pointer"
                title="View SQL Script"
              >
                {showSqlPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showSqlPreview && (
            <pre className="p-3 rounded-xl bg-black/60 border border-outline-variant/25 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-44 select-all">
              {SUPABASE_SETUP_SQL}
            </pre>
          )}
        </div>

        {/* Supabase Credentials Configuration */}
        <form onSubmit={handleSaveAndSync} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-primary-container" />
              Supabase Project URL
            </label>
            <input
              type="text"
              value={dbUrlInput}
              onChange={(e) => setDbUrlInput(e.target.value)}
              placeholder="https://abcdefghijklm.supabase.co"
              className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/45 focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Anon / Publishable API Key
            </label>
            <input
              type="password"
              value={supabaseKeyInput}
              onChange={(e) => setSupabaseKeyInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (or sb_publishable_...)"
              className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/45 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {syncStatus !== 'idle' && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-mono flex items-start gap-2.5 ${
                syncStatus === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-400/35 text-emerald-300'
                  : syncStatus === 'error'
                  ? 'bg-rose-500/15 border border-rose-400/35 text-rose-300'
                  : 'bg-primary-container/15 border border-primary-container/35 text-primary-container'
              }`}
            >
              {syncStatus === 'syncing' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
              {syncStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {syncStatus === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="submit"
              className="liquid-button-primary px-5 py-2.5 rounded-xl text-xs font-headline font-bold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Save &amp; Sync Classroom to Supabase
            </button>
          </div>
        </form>

        {/* Student Shareable Web Link */}
        <div className="glass-well rounded-2xl p-4 space-y-2.5 border border-outline-variant/20">
          <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-primary-container" />
            Shareable Student Web App Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={studentShareUrl}
              className="flex-1 glass-panel rounded-xl px-3.5 py-2.5 text-xs font-mono text-primary-container select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl glass-pill text-xs font-mono font-bold text-on-surface hover:border-primary-container flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-[11px] font-mono text-on-surface-variant">
            Share this link with your students on WhatsApp or Google Classroom so they can open their bank from any phone or computer with automatic Supabase connection.
          </p>
        </div>

        {/* P2P Classmate Transfer Rule Toggle */}
        <label className="glass-well rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer border border-outline-variant/20">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-headline font-bold text-on-surface">
                Allow Cross-Classroom Friend Transfers (All Courses)
              </p>
              <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">
                When unchecked (recommended), students can only send money to classmates in their own course/classroom.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(settings.allowCrossClassTransfers)}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                allowCrossClassTransfers: e.target.checked,
              })
            }
            className="w-5 h-5 accent-cyan-400 rounded"
          />
        </label>
      </div>
    </div>
  );
};
