import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  Student,
  Loan,
  StoreItem,
  Classroom,
  TeacherSettings,
  PendingStudentRequest,
} from '../types';

export interface CloudClassroomState {
  version: number;
  updatedAt: string;
  students: Student[];
  loans: Loan[];
  storeCatalog: StoreItem[];
  classrooms: Classroom[];
  settings: TeacherSettings;
  pendingRequests: PendingStudentRequest[];
}

export type StudentActionPayload =
  | {
      id: string;
      type: 'UPDATE_PROFILE';
      studentId: string;
      avatarUrl?: string;
      customPassword?: string;
      createdAt: string;
    }
  | {
      id: string;
      type: 'ACKNOWLEDGE_DISCLAIMERS';
      studentId: string;
      disclaimerIds: string[];
      createdAt: string;
    }
  | {
      id: string;
      type: 'SUBMIT_REQUEST';
      request: PendingStudentRequest;
      createdAt: string;
    }
  | {
      id: string;
      type: 'CANCEL_REQUEST';
      requestId: string;
      studentId: string;
      createdAt: string;
    };

export const SUPABASE_SETUP_SQL = `-- ============================================================================
-- DIDACTIC ESL ATM 4.0 - SUPABASE CLOUD DATABASE SETUP (RUN ONCE)
-- Paste this into Supabase Dashboard -> SQL Editor -> Click "Run"
-- ============================================================================

create table if not exists public.atm_classroom_state (
  id text primary key default 'main',
  version integer not null default 4,
  updated_at timestamptz not null default now(),
  state jsonb not null
);

create table if not exists public.atm_student_actions (
  id text primary key,
  action_type text not null,
  student_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_atm_student_actions_created_at
  on public.atm_student_actions (created_at asc);

alter table public.atm_classroom_state enable row level security;
alter table public.atm_student_actions enable row level security;

drop policy if exists "Allow public read/write on atm_classroom_state" on public.atm_classroom_state;
create policy "Allow public read/write on atm_classroom_state"
  on public.atm_classroom_state
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow public read/write on atm_student_actions" on public.atm_student_actions;
create policy "Allow public read/write on atm_student_actions"
  on public.atm_student_actions
  for all
  to anon, authenticated
  using (true)
  with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'atm_classroom_state'
  ) then
    alter publication supabase_realtime add table public.atm_classroom_state;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'atm_student_actions'
  ) then
    alter publication supabase_realtime add table public.atm_student_actions;
  end if;
end $$;`;

const BROADCAST_CHANNEL_NAME = 'esl_atm_v4_realtime_sync';
const CLOUD_URL_STORAGE_KEY = 'esl_classroom_cloud_db_url';
const CLOUD_KEY_STORAGE_KEY = 'esl_classroom_cloud_supabase_key';
const PROCESSED_ACTIONS_KEY = 'esl_classroom_processed_action_ids';

export const DEFAULT_SUPABASE_URL = 'https://fovucovcxlwutweyldai.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_b9Pd24FUbxxAdLb6YwXTsA_PkWFf8XS';

// Singleton Supabase client cache per (url + key)
let cachedClientKey = '';
let cachedSupabaseClient: SupabaseClient | null = null;
let lastPushedContentFingerprint = '';

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  if (!cleaned) return '';
  // Automatically upgrade legacy Firebase URLs to the new Supabase Project URL
  if (cleaned.includes('firebaseio.com') || cleaned.includes('firebasedatabase.app')) {
    return DEFAULT_SUPABASE_URL;
  }
  cleaned = cleaned.replace(/\/+$/, '').replace(/\/rest\/v1.*$/, '').replace(/\/atm_v4.*$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

// Keep alias for compatibility across components
export const normalizeFirebaseDbUrl = normalizeSupabaseUrl;

export function normalizeSupabaseKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']+|["']+$/g, '');
}

export function getConfiguredCloudDbUrl(settingsUrl?: string): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('db') || params.get('supabaseUrl');
    const keyFromQuery = params.get('key') || params.get('apikey');
    if (keyFromQuery) {
      const cleanKey = normalizeSupabaseKey(keyFromQuery);
      if (cleanKey) {
        localStorage.setItem(CLOUD_KEY_STORAGE_KEY, cleanKey);
      }
    }
    if (fromQuery) {
      const normalized = normalizeSupabaseUrl(fromQuery);
      if (normalized) {
        localStorage.setItem(CLOUD_URL_STORAGE_KEY, normalized);
        return normalized;
      }
    }
  } catch {
    // ignore
  }

  if (settingsUrl && normalizeSupabaseUrl(settingsUrl)) {
    const normalized = normalizeSupabaseUrl(settingsUrl);
    try {
      localStorage.setItem(CLOUD_URL_STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
    return normalized;
  }

  try {
    const saved = localStorage.getItem(CLOUD_URL_STORAGE_KEY);
    if (saved) return normalizeSupabaseUrl(saved);
  } catch {
    // ignore
  }

  const envObj = (import.meta as unknown as { env?: Record<string, string> }).env;
  const envUrl = envObj?.VITE_SUPABASE_URL || envObj?.VITE_FIREBASE_DB_URL;
  if (envUrl) return normalizeSupabaseUrl(envUrl);

  return DEFAULT_SUPABASE_URL;
}

export function getConfiguredSupabaseKey(settingsKey?: string): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('key') || params.get('apikey');
    if (fromQuery) {
      const cleaned = normalizeSupabaseKey(fromQuery);
      if (cleaned) {
        localStorage.setItem(CLOUD_KEY_STORAGE_KEY, cleaned);
        return cleaned;
      }
    }
  } catch {
    // ignore
  }

  if (settingsKey && normalizeSupabaseKey(settingsKey)) {
    const cleaned = normalizeSupabaseKey(settingsKey);
    try {
      localStorage.setItem(CLOUD_KEY_STORAGE_KEY, cleaned);
    } catch {
      // ignore
    }
    return cleaned;
  }

  try {
    const saved = localStorage.getItem(CLOUD_KEY_STORAGE_KEY);
    if (saved) return normalizeSupabaseKey(saved);
  } catch {
    // ignore
  }

  const envObj = (import.meta as unknown as { env?: Record<string, string> }).env;
  const envKey = envObj?.VITE_SUPABASE_ANON_KEY;
  if (envKey) return normalizeSupabaseKey(envKey);

  return DEFAULT_SUPABASE_ANON_KEY;
}

export function saveConfiguredCloudDbUrl(
  rawUrl: string,
  rawAnonKey?: string
): string {
  const normalizedUrl = normalizeSupabaseUrl(rawUrl);
  try {
    if (normalizedUrl) {
      localStorage.setItem(CLOUD_URL_STORAGE_KEY, normalizedUrl);
    } else {
      localStorage.removeItem(CLOUD_URL_STORAGE_KEY);
    }

    if (rawAnonKey !== undefined) {
      const cleanedKey = normalizeSupabaseKey(rawAnonKey);
      if (cleanedKey) {
        localStorage.setItem(CLOUD_KEY_STORAGE_KEY, cleanedKey);
      } else {
        localStorage.removeItem(CLOUD_KEY_STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
  return normalizedUrl;
}

function getSupabaseClient(dbUrl?: string, supabaseKey?: string): SupabaseClient | null {
  const url = normalizeSupabaseUrl(dbUrl || getConfiguredCloudDbUrl());
  const key = normalizeSupabaseKey(supabaseKey || getConfiguredSupabaseKey());

  if (!url || !key) return null;

  const cacheId = `${url}::${key}`;
  if (cachedSupabaseClient && cachedClientKey === cacheId) {
    return cachedSupabaseClient;
  }

  try {
    cachedSupabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    cachedClientKey = cacheId;
    return cachedSupabaseClient;
  } catch {
    return null;
  }
}

export function getProcessedActionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PROCESSED_ACTIONS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function markActionProcessed(actionId: string): void {
  try {
    const set = getProcessedActionIds();
    set.add(actionId);
    const recent = Array.from(set).slice(-500);
    localStorage.setItem(PROCESSED_ACTIONS_KEY, JSON.stringify(recent));
  } catch {
    // ignore
  }
}

function getActionStudentId(action: StudentActionPayload): string {
  if (action.type === 'SUBMIT_REQUEST') {
    return action.request.studentId;
  }
  return action.studentId;
}

/**
 * Pure helper that applies a StudentActionPayload to a CloudClassroomState
 * idempotently, returning the updated state.
 */
export function applyStudentActionToState(
  state: CloudClassroomState,
  action: StudentActionPayload
): CloudClassroomState {
  if (action.type === 'UPDATE_PROFILE') {
    const updatedStudents = state.students.map((s) => {
      if (s.id !== action.studentId) return s;
      return {
        ...s,
        avatarUrl: action.avatarUrl !== undefined ? action.avatarUrl : s.avatarUrl,
        customPassword:
          action.customPassword !== undefined ? action.customPassword : s.customPassword,
      };
    });
    return {
      ...state,
      updatedAt: new Date().toISOString(),
      students: updatedStudents,
    };
  }

  if (action.type === 'ACKNOWLEDGE_DISCLAIMERS') {
    const ackTime = new Date().toISOString();
    const updatedStudents = state.students.map((s) => {
      if (s.id !== action.studentId) return s;
      const updatedDisclaimers = (s.disclaimers || []).map((d) =>
        action.disclaimerIds.includes(d.id) && !d.acknowledgedAt
          ? { ...d, acknowledgedAt: ackTime }
          : d
      );
      return {
        ...s,
        disclaimers: updatedDisclaimers,
      };
    });
    return {
      ...state,
      updatedAt: ackTime,
      students: updatedStudents,
    };
  }

  if (action.type === 'SUBMIT_REQUEST') {
    const req = action.request;
    // Prevent duplicate request insertion
    if (state.pendingRequests.some((r) => r.id === req.id)) {
      return state;
    }

    const updatedRequests = [req, ...state.pendingRequests];
    const updatedStudents = state.students.map((s) => {
      if (s.id !== req.studentId) return s;
      if (req.reservedAmount > 0) {
        return {
          ...s,
          reservedBalance: (s.reservedBalance || 0) + req.reservedAmount,
        };
      }
      return s;
    });

    return {
      ...state,
      updatedAt: new Date().toISOString(),
      students: updatedStudents,
      pendingRequests: updatedRequests,
    };
  }

  if (action.type === 'CANCEL_REQUEST') {
    const existing = state.pendingRequests.find(
      (r) => r.id === action.requestId && r.studentId === action.studentId && r.status === 'pending'
    );
    if (!existing) return state;

    const updatedRequests = state.pendingRequests.filter((r) => r.id !== action.requestId);
    const updatedStudents = state.students.map((s) => {
      if (s.id !== existing.studentId) return s;
      if (existing.reservedAmount > 0) {
        return {
          ...s,
          reservedBalance: Math.max(0, (s.reservedBalance || 0) - existing.reservedAmount),
        };
      }
      return s;
    });

    return {
      ...state,
      updatedAt: new Date().toISOString(),
      students: updatedStudents,
      pendingRequests: updatedRequests,
    };
  }

  return state;
}

function formatSupabaseError(error: { code?: string; message?: string; details?: string }): string {
  const code = error.code || '';
  const msg = error.message || 'Unknown Supabase error';
  if (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('atm_classroom_state') ||
    msg.includes('relation') ||
    msg.includes('schema cache')
  ) {
    return 'Supabase tables are not created yet. Click "Copy SQL Setup Script" below, paste it into your Supabase SQL Editor, and click Run!';
  }
  if (code === '42501' || msg.toLowerCase().includes('row-level security')) {
    return 'Row-Level Security blocked access. Please run the SQL Setup Script in your Supabase SQL Editor to enable classroom policies.';
  }
  return `Supabase error: ${msg}`;
}

/**
 * Push full authoritative state from ATM 4.0 Teacher App to Supabase & Local BroadcastChannel.
 */
export async function pushClassroomStateToCloud(
  state: CloudClassroomState,
  dbUrl?: string,
  supabaseKey?: string,
  options?: { force?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  // 1. Broadcast locally across browser windows/tabs (0ms on same PC)
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage({ kind: 'STATE_SYNC', state });
    bc.close();
  } catch {
    // BroadcastChannel not supported in environment
  }

  // Also cache snapshot in localStorage for instant local Student Web App preview
  try {
    localStorage.setItem('esl_classroom_live_state_cache', JSON.stringify(state));
  } catch {
    // ignore quota errors
  }

  const targetUrl = normalizeSupabaseUrl(
    dbUrl || getConfiguredCloudDbUrl(state.settings?.cloudDatabaseUrl)
  );
  const targetKey = normalizeSupabaseKey(
    supabaseKey || getConfiguredSupabaseKey(state.settings?.cloudSupabaseKey)
  );

  if (!targetUrl) {
    return { ok: true };
  }

  if (!targetKey) {
    return {
      ok: false,
      error: 'Please enter your Supabase Anon / Publishable API Key alongside the Project URL.',
    };
  }

  // Avoid duplicate network uploads when state content hasn't changed
  const contentFingerprint = JSON.stringify({
    s: state.students,
    l: state.loans,
    c: state.storeCatalog,
    cl: state.classrooms,
    st: state.settings,
    p: state.pendingRequests,
  });

  if (!options?.force && contentFingerprint === lastPushedContentFingerprint) {
    return { ok: true };
  }

  const supabase = getSupabaseClient(targetUrl, targetKey);
  if (!supabase) {
    return {
      ok: false,
      error: 'Invalid Supabase URL or Anon Key format.',
    };
  }

  try {
    const nowIso = state.updatedAt || new Date().toISOString();
    const stateToStore: CloudClassroomState = {
      ...state,
      updatedAt: nowIso,
    };

    const { error } = await supabase.from('atm_classroom_state').upsert(
      {
        id: 'main',
        version: state.version || 4,
        updated_at: nowIso,
        state: stateToStore,
      },
      { onConflict: 'id' }
    );

    if (error) {
      return {
        ok: false,
        error: formatSupabaseError(error),
      };
    }

    lastPushedContentFingerprint = contentFingerprint;
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error connecting to Supabase.',
    };
  }
}

/**
 * Fetch latest classroom state from Supabase (or local cache fallback).
 * Automatically merges any queued atomic rows from `atm_student_actions`.
 */
export async function fetchClassroomStateFromCloud(
  dbUrl?: string,
  supabaseKey?: string
): Promise<{ state: CloudClassroomState | null; source: 'cloud' | 'local' | 'none'; error?: string }> {
  const targetUrl = normalizeSupabaseUrl(dbUrl || getConfiguredCloudDbUrl());
  const targetKey = normalizeSupabaseKey(supabaseKey || getConfiguredSupabaseKey());

  if (targetUrl && targetKey) {
    const supabase = getSupabaseClient(targetUrl, targetKey);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('atm_classroom_state')
          .select('version, updated_at, state')
          .eq('id', 'main')
          .maybeSingle();

        if (error) {
          const localFallback = loadLocalClassroomStateFallback();
          if (localFallback) {
            return { state: localFallback, source: 'local', error: formatSupabaseError(error) };
          }
          return {
            state: null,
            source: 'none',
            error: formatSupabaseError(error),
          };
        }

        if (data && data.state && typeof data.state === 'object') {
          const rawState = data.state as Partial<CloudClassroomState>;
          let mergedState: CloudClassroomState = {
            version: data.version || rawState.version || 4,
            updatedAt: rawState.updatedAt || data.updated_at || new Date().toISOString(),
            students: Array.isArray(rawState.students) ? rawState.students : [],
            loans: Array.isArray(rawState.loans) ? rawState.loans : [],
            storeCatalog: Array.isArray(rawState.storeCatalog) ? rawState.storeCatalog : [],
            classrooms: Array.isArray(rawState.classrooms) ? rawState.classrooms : [],
            settings: (rawState.settings || {}) as TeacherSettings,
            pendingRequests: Array.isArray(rawState.pendingRequests) ? rawState.pendingRequests : [],
          };

          // Also fetch and merge any unmerged atomic student_actions rows
          try {
            const { data: actionRows } = await supabase
              .from('atm_student_actions')
              .select('payload, created_at')
              .order('created_at', { ascending: true });

            if (Array.isArray(actionRows) && actionRows.length > 0) {
              for (const row of actionRows) {
                if (row?.payload) {
                  mergedState = applyStudentActionToState(
                    mergedState,
                    row.payload as StudentActionPayload
                  );
                }
              }
            }
          } catch {
            // ignore action queue fetch error
          }

          try {
            localStorage.setItem('esl_classroom_live_state_cache', JSON.stringify(mergedState));
          } catch {
            // ignore
          }

          return { state: mergedState, source: 'cloud' };
        }
      } catch (err) {
        const localFallback = loadLocalClassroomStateFallback();
        if (localFallback) {
          return { state: localFallback, source: 'local' };
        }
        return {
          state: null,
          source: 'none',
          error: err instanceof Error ? err.message : 'Unable to reach Supabase server.',
        };
      }
    }
  }

  const localFallback = loadLocalClassroomStateFallback();
  if (localFallback) {
    return { state: localFallback, source: 'local' };
  }

  return { state: null, source: 'none' };
}

export function loadLocalClassroomStateFallback(): CloudClassroomState | null {
  try {
    const cached = localStorage.getItem('esl_classroom_live_state_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.students)) {
        return parsed;
      }
    }

    const studentsRaw = localStorage.getItem('esl_classroom_students');
    const loansRaw = localStorage.getItem('esl_classroom_loans');
    const settingsRaw = localStorage.getItem('esl_classroom_settings');
    const storeRaw = localStorage.getItem('esl_classroom_store_catalog_v1');
    const classesRaw = localStorage.getItem('esl_classroom_classes_v1');
    const pendingRaw = localStorage.getItem('esl_classroom_pending_requests');

    if (studentsRaw) {
      return {
        version: 4,
        updatedAt: new Date().toISOString(),
        students: JSON.parse(studentsRaw),
        loans: loansRaw ? JSON.parse(loansRaw) : [],
        storeCatalog: storeRaw ? JSON.parse(storeRaw) : [],
        classrooms: classesRaw ? JSON.parse(classesRaw) : [],
        settings: settingsRaw ? JSON.parse(settingsRaw) : undefined,
        pendingRequests: pendingRaw ? JSON.parse(pendingRaw) : [],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Dispatch an atomic student action from the Student Web App to ATM 4.0
 * via Supabase `atm_student_actions` table (~300 bytes instead of full state upload!) + BroadcastChannel.
 */
export async function dispatchStudentAction(
  action: StudentActionPayload,
  currentState: CloudClassroomState | null,
  dbUrl?: string,
  supabaseKey?: string
): Promise<{ ok: boolean; updatedState: CloudClassroomState | null; error?: string }> {
  const nextState = currentState ? applyStudentActionToState(currentState, action) : null;

  // 1. Broadcast locally immediately so ATM 4.0 on the same PC sees it in 0ms
  try {
    const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.postMessage({ kind: 'STUDENT_ACTION', action, state: nextState });
    bc.close();
  } catch {
    // ignore
  }

  if (nextState) {
    try {
      localStorage.setItem('esl_classroom_live_state_cache', JSON.stringify(nextState));
    } catch {
      // ignore
    }
  }

  // 2. Push atomic row to Supabase if configured
  const targetUrl = normalizeSupabaseUrl(
    dbUrl || getConfiguredCloudDbUrl(currentState?.settings?.cloudDatabaseUrl)
  );
  const targetKey = normalizeSupabaseKey(
    supabaseKey || getConfiguredSupabaseKey(currentState?.settings?.cloudSupabaseKey)
  );

  if (!targetUrl || !targetKey) {
    return { ok: true, updatedState: nextState };
  }

  const supabase = getSupabaseClient(targetUrl, targetKey);
  if (!supabase) {
    return { ok: true, updatedState: nextState };
  }

  try {
    const { error } = await supabase.from('atm_student_actions').upsert(
      {
        id: action.id,
        action_type: action.type,
        student_id: getActionStudentId(action),
        payload: action,
        created_at: action.createdAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      return {
        ok: false,
        updatedState: nextState,
        error: formatSupabaseError(error),
      };
    }

    return { ok: true, updatedState: nextState };
  } catch (err) {
    return {
      ok: false,
      updatedState: nextState,
      error: err instanceof Error ? err.message : 'Failed to send transaction to Supabase.',
    };
  }
}

/**
 * Clear a processed student action from the Supabase queue after ATM 4.0 has merged it.
 */
export async function removeCloudStudentAction(
  actionId: string,
  dbUrl?: string,
  supabaseKey?: string
): Promise<void> {
  const targetUrl = normalizeSupabaseUrl(dbUrl || getConfiguredCloudDbUrl());
  const targetKey = normalizeSupabaseKey(supabaseKey || getConfiguredSupabaseKey());
  if (!targetUrl || !targetKey) return;

  const supabase = getSupabaseClient(targetUrl, targetKey);
  if (!supabase) return;

  try {
    await supabase.from('atm_student_actions').delete().eq('id', actionId);
  } catch {
    // ignore
  }
}

/**
 * Subscribe to real-time updates:
 * 1. Local BroadcastChannel (0ms on same PC)
 * 2. Supabase Realtime WebSockets (`postgres_changes` on `atm_classroom_state` & `atm_student_actions`)
 * 3. Ultra-lightweight 38-byte timestamp fallback check when tab is visible
 */
export function subscribeToClassroomRealtime(options: {
  role: 'teacher' | 'student';
  dbUrl?: string;
  supabaseKey?: string;
  onStateSync?: (state: CloudClassroomState) => void;
  onStudentAction?: (action: StudentActionPayload) => void;
}): () => void {
  const { role, dbUrl, supabaseKey, onStateSync, onStudentAction } = options;
  let isClosed = false;
  let lastSeenUpdatedAt = '';
  let lastSeenActionCount = -1;

  // 1. Local BroadcastChannel listener (0ms on same PC)
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.onmessage = (ev) => {
      if (isClosed || !ev.data) return;
      if (ev.data.kind === 'STATE_SYNC' && ev.data.state && onStateSync) {
        lastSeenUpdatedAt = ev.data.state.updatedAt || '';
        onStateSync(ev.data.state);
      } else if (ev.data.kind === 'STUDENT_ACTION' && ev.data.action) {
        if (role === 'teacher' && onStudentAction) {
          const act = ev.data.action as StudentActionPayload;
          const processed = getProcessedActionIds();
          if (act.id && !processed.has(act.id)) {
            markActionProcessed(act.id);
            onStudentAction(act);
            removeCloudStudentAction(act.id, dbUrl, supabaseKey);
          }
        } else if (role === 'student' && ev.data.state && onStateSync) {
          lastSeenUpdatedAt = ev.data.state.updatedAt || '';
          onStateSync(ev.data.state);
        }
      }
    };
  } catch {
    // ignore
  }

  // 2. Supabase Realtime WebSocket + lightweight metadata check fallback
  const targetUrl = normalizeSupabaseUrl(dbUrl || getConfiguredCloudDbUrl());
  const targetKey = normalizeSupabaseKey(supabaseKey || getConfiguredSupabaseKey());
  const supabase = getSupabaseClient(targetUrl, targetKey);

  let pollTimer: number | null = null;
  let realtimeChannel: RealtimeChannel | null = null;

  if (supabase && targetUrl && targetKey) {
    const checkTeacherActions = async () => {
      if (isClosed || !onStudentAction) return;
      try {
        const { data: rows, error } = await supabase
          .from('atm_student_actions')
          .select('id, payload, created_at')
          .order('created_at', { ascending: true });

        if (error || !Array.isArray(rows) || rows.length === 0) return;

        const processed = getProcessedActionIds();
        for (const row of rows) {
          const act = row.payload as StudentActionPayload;
          if (act && act.id && !processed.has(act.id)) {
            markActionProcessed(act.id);
            onStudentAction(act);
            removeCloudStudentAction(act.id, targetUrl, targetKey);
          } else if (row.id && processed.has(row.id)) {
            // Clean up already-processed leftover action row
            removeCloudStudentAction(row.id, targetUrl, targetKey);
          }
        }
      } catch {
        // ignore transient network errors
      }
    };

    const checkStudentState = async (forceFullFetch = false) => {
      if (isClosed || !onStateSync) return;
      if (!forceFullFetch && typeof document !== 'undefined' && document.hidden) return;
      try {
        if (!forceFullFetch && lastSeenUpdatedAt) {
          // Ultra-lightweight 38-byte metadata check (selects ONLY `updated_at`, not the JSONB blob!)
          const [{ data: metaRow }, { count: actionCount }] = await Promise.all([
            supabase
              .from('atm_classroom_state')
              .select('updated_at')
              .eq('id', 'main')
              .maybeSingle(),
            supabase
              .from('atm_student_actions')
              .select('id', { count: 'exact', head: true }),
          ]);

          const remoteStamp = metaRow?.updated_at || '';
          const currentActionCount = typeof actionCount === 'number' ? actionCount : 0;

          if (
            remoteStamp &&
            remoteStamp === lastSeenUpdatedAt &&
            currentActionCount === lastSeenActionCount
          ) {
            return; // 0 KB state download needed!
          }
          lastSeenActionCount = currentActionCount;
        }

        const res = await fetchClassroomStateFromCloud(targetUrl, targetKey);
        if (res.state) {
          lastSeenUpdatedAt = res.state.updatedAt || '';
          onStateSync(res.state);
        }
      } catch {
        // ignore transient network errors
      }
    };

    // Subscribe to Supabase Realtime Postgres Changes over a single WebSocket
    try {
      const channelName = `esl_atm_v4_${role}_${Math.random().toString(36).slice(2, 8)}`;
      realtimeChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'atm_student_actions',
          },
          (payload) => {
            if (isClosed) return;
            if (role === 'teacher' && onStudentAction) {
              const newRow = payload.new as { id?: string; payload?: StudentActionPayload };
              const act = newRow?.payload;
              if (act && act.id) {
                const processed = getProcessedActionIds();
                if (!processed.has(act.id)) {
                  markActionProcessed(act.id);
                  onStudentAction(act);
                  removeCloudStudentAction(act.id, targetUrl, targetKey);
                }
              } else {
                checkTeacherActions();
              }
            } else if (role === 'student') {
              checkStudentState(true);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'atm_classroom_state',
          },
          () => {
            if (isClosed) return;
            if (role === 'student') {
              checkStudentState(true);
            }
          }
        )
        .subscribe();
    } catch {
      // Fallback to lightweight metadata check if WebSocket is blocked
    }

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        if (role === 'teacher') checkTeacherActions();
        else checkStudentState(false);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    // Initial check + low-frequency 8s lightweight fallback check (38 bytes only)
    if (role === 'teacher') {
      checkTeacherActions();
      pollTimer = window.setInterval(checkTeacherActions, 6000);
    } else {
      checkStudentState(true);
      pollTimer = window.setInterval(() => checkStudentState(false), 8000);
    }

    return () => {
      isClosed = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      if (realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch {
          // ignore
        }
      }
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
      if (pollTimer !== null) {
        clearInterval(pollTimer);
      }
    };
  }

  return () => {
    isClosed = true;
    if (bc) {
      try {
        bc.close();
      } catch {
        // ignore
      }
    }
    if (pollTimer !== null) {
      clearInterval(pollTimer);
    }
  };
}
