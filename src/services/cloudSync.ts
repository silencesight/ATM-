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

const BROADCAST_CHANNEL_NAME = 'esl_atm_v4_realtime_sync';
const CLOUD_URL_STORAGE_KEY = 'esl_classroom_cloud_db_url';
const PROCESSED_ACTIONS_KEY = 'esl_classroom_processed_action_ids';

export function normalizeFirebaseDbUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  if (!cleaned) return '';
  // Remove trailing slashes or .json suffixes
  cleaned = cleaned.replace(/\/+$/, '').replace(/\/atm_v4.*$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

export function getConfiguredCloudDbUrl(settingsUrl?: string): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('db');
    if (fromQuery) {
      const normalized = normalizeFirebaseDbUrl(fromQuery);
      if (normalized) {
        localStorage.setItem(CLOUD_URL_STORAGE_KEY, normalized);
        return normalized;
      }
    }
  } catch {
    // ignore
  }

  if (settingsUrl && normalizeFirebaseDbUrl(settingsUrl)) {
    const normalized = normalizeFirebaseDbUrl(settingsUrl);
    try {
      localStorage.setItem(CLOUD_URL_STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
    return normalized;
  }

  try {
    const saved = localStorage.getItem(CLOUD_URL_STORAGE_KEY);
    if (saved) return normalizeFirebaseDbUrl(saved);
  } catch {
    // ignore
  }

  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_FIREBASE_DB_URL;
  if (envUrl) return normalizeFirebaseDbUrl(envUrl);

  return '';
}

export function saveConfiguredCloudDbUrl(rawUrl: string): string {
  const normalized = normalizeFirebaseDbUrl(rawUrl);
  try {
    if (normalized) {
      localStorage.setItem(CLOUD_URL_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(CLOUD_URL_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  return normalized;
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

/**
 * Pure helper that applies a StudentActionPayload to a CloudClassroomState
 * idempotently, returning the updated state (or null if already applied).
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

/**
 * Push full authoritative state from ATM 4.0 Teacher App to Cloud & Local BroadcastChannel.
 */
export async function pushClassroomStateToCloud(
  state: CloudClassroomState,
  dbUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  // 1. Broadcast locally across browser windows/tabs
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

  const targetUrl = normalizeFirebaseDbUrl(dbUrl || getConfiguredCloudDbUrl(state.settings?.cloudDatabaseUrl));
  if (!targetUrl) {
    return { ok: true };
  }

  try {
    const response = await fetch(`${targetUrl}/atm_v4/state.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `Cloud database returned HTTP ${response.status}. Make sure Firebase Realtime Database rules allow read/write.`,
      };
    }
    // Write tiny 30-byte version stamp so connected student devices only fetch state.json when updatedAt changes
    await fetch(`${targetUrl}/atm_v4/updatedAt.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.updatedAt),
    }).catch(() => {});
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error connecting to cloud database.',
    };
  }
}

/**
 * Fetch latest classroom state from Cloud (or local cache fallback).
 */
export async function fetchClassroomStateFromCloud(
  dbUrl?: string
): Promise<{ state: CloudClassroomState | null; source: 'cloud' | 'local' | 'none'; error?: string }> {
  const targetUrl = normalizeFirebaseDbUrl(dbUrl || getConfiguredCloudDbUrl());

  if (targetUrl) {
    try {
      const response = await fetch(`${targetUrl}/atm_v4/state.json`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.students)) {
          // Also check if there are any unmerged student_actions in the queue
          let mergedState: CloudClassroomState = {
            version: data.version || 4,
            updatedAt: data.updatedAt || new Date().toISOString(),
            students: data.students || [],
            loans: data.loans || [],
            storeCatalog: data.storeCatalog || [],
            classrooms: data.classrooms || [],
            settings: data.settings,
            pendingRequests: data.pendingRequests || [],
          };

          try {
            const actionsRes = await fetch(`${targetUrl}/atm_v4/student_actions.json`);
            if (actionsRes.ok) {
              const actionsMap = await actionsRes.json();
              if (actionsMap && typeof actionsMap === 'object') {
                const actionsList = Object.values(actionsMap) as StudentActionPayload[];
                actionsList.sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                for (const act of actionsList) {
                  mergedState = applyStudentActionToState(mergedState, act);
                }
              }
            }
          } catch {
            // ignore action queue fetch error
          }

          return { state: mergedState, source: 'cloud' };
        }
      } else {
        return {
          state: null,
          source: 'none',
          error: `Cloud database responded with HTTP ${response.status}.`,
        };
      }
    } catch (err) {
      // Fallback to local if offline
      const localFallback = loadLocalClassroomStateFallback();
      if (localFallback) {
        return { state: localFallback, source: 'local' };
      }
      return {
        state: null,
        source: 'none',
        error: err instanceof Error ? err.message : 'Unable to reach cloud server.',
      };
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
 * Dispatch an action from the Student Web App to ATM 4.0 (via Cloud + BroadcastChannel).
 */
export async function dispatchStudentAction(
  action: StudentActionPayload,
  currentState: CloudClassroomState | null,
  dbUrl?: string
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

  // 2. Push to Cloud Database if configured
  const targetUrl = normalizeFirebaseDbUrl(
    dbUrl || getConfiguredCloudDbUrl(currentState?.settings?.cloudDatabaseUrl)
  );
  if (!targetUrl) {
    return { ok: true, updatedState: nextState };
  }

  try {
    // Write atomic action to student_actions queue so ATM 4.0 processes it cleanly
    await fetch(`${targetUrl}/atm_v4/student_actions/${action.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });

    // Also update state snapshot so if teacher desktop app is currently closed,
    // other students and this student on refresh see the up-to-date state immediately.
    if (nextState) {
      await fetch(`${targetUrl}/atm_v4/state.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState),
      });
      await fetch(`${targetUrl}/atm_v4/updatedAt.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState.updatedAt),
      }).catch(() => {});
    }

    return { ok: true, updatedState: nextState };
  } catch (err) {
    return {
      ok: false,
      updatedState: nextState,
      error: err instanceof Error ? err.message : 'Failed to send transaction to cloud.',
    };
  }
}

/**
 * Clear a processed student action from the cloud queue after ATM 4.0 has merged it.
 */
export async function removeCloudStudentAction(actionId: string, dbUrl?: string): Promise<void> {
  const targetUrl = normalizeFirebaseDbUrl(dbUrl || getConfiguredCloudDbUrl());
  if (!targetUrl) return;
  try {
    await fetch(`${targetUrl}/atm_v4/student_actions/${actionId}.json`, {
      method: 'DELETE',
    });
  } catch {
    // ignore
  }
}

/**
 * Subscribe to real-time updates (local BroadcastChannel + Firebase Server-Sent Events + ultra-lightweight 30-byte stamp check).
 */
export function subscribeToClassroomRealtime(options: {
  role: 'teacher' | 'student';
  dbUrl?: string;
  onStateSync?: (state: CloudClassroomState) => void;
  onStudentAction?: (action: StudentActionPayload) => void;
}): () => void {
  const { role, dbUrl, onStateSync, onStudentAction } = options;
  let isClosed = false;
  let lastSeenUpdatedAt = '';

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
          onStudentAction(ev.data.action);
        } else if (role === 'student' && ev.data.state && onStateSync) {
          lastSeenUpdatedAt = ev.data.state.updatedAt || '';
          onStateSync(ev.data.state);
        }
      }
    };
  } catch {
    // ignore
  }

  // 2. Cloud Server-Sent Events (instant push) + ultra-lightweight 30-byte version check fallback
  const targetUrl = normalizeFirebaseDbUrl(dbUrl || getConfiguredCloudDbUrl());
  let pollTimer: number | null = null;
  let eventSource: EventSource | null = null;

  if (targetUrl) {
    const checkTeacherActions = async () => {
      if (isClosed || !onStudentAction) return;
      try {
        // 4-byte shallow check first so idle polling consumes virtually 0 bandwidth
        const shallowRes = await fetch(`${targetUrl}/atm_v4/student_actions.json?shallow=true`);
        if (!shallowRes.ok) return;
        const shallowData = await shallowRes.json();
        if (!shallowData) return;

        const res = await fetch(`${targetUrl}/atm_v4/student_actions.json`);
        if (res.ok) {
          const actionsMap = await res.json();
          if (actionsMap && typeof actionsMap === 'object') {
            const processed = getProcessedActionIds();
            const actions = Object.values(actionsMap) as StudentActionPayload[];
            actions.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            for (const act of actions) {
              if (act && act.id && !processed.has(act.id)) {
                markActionProcessed(act.id);
                onStudentAction(act);
                removeCloudStudentAction(act.id, targetUrl);
              }
            }
          }
        }
      } catch {
        // ignore transient network errors
      }
    };

    const checkStudentState = async (forceFullFetch = false) => {
      if (isClosed || !onStateSync) return;
      // Pause background polling when phone screen is off or browser tab is hidden
      if (!forceFullFetch && typeof document !== 'undefined' && document.hidden) return;
      try {
        if (!forceFullFetch && lastSeenUpdatedAt) {
          // 30-byte timestamp check: only download state.json if something actually changed!
          const stampRes = await fetch(`${targetUrl}/atm_v4/updatedAt.json`);
          if (stampRes.ok) {
            const remoteStamp = await stampRes.json();
            if (typeof remoteStamp === 'string' && remoteStamp === lastSeenUpdatedAt) {
              return; // 0 KB state download needed!
            }
          }
        }
        const res = await fetchClassroomStateFromCloud(targetUrl);
        if (res.state) {
          lastSeenUpdatedAt = res.state.updatedAt || '';
          onStateSync(res.state);
        }
      } catch {
        // ignore transient network errors
      }
    };

    // Connect Firebase native Server-Sent Events (SSE) for instant (<0.2s) push notifications
    try {
      const sseEndpoint =
        role === 'teacher'
          ? `${targetUrl}/atm_v4/student_actions.json`
          : `${targetUrl}/atm_v4/updatedAt.json`;
      eventSource = new EventSource(sseEndpoint);
      eventSource.addEventListener('put', () => {
        if (role === 'teacher') {
          checkTeacherActions();
        } else {
          checkStudentState(false);
        }
      });
      eventSource.addEventListener('patch', () => {
        if (role === 'teacher') {
          checkTeacherActions();
        } else {
          checkStudentState(false);
        }
      });
    } catch {
      // Fallback to lightweight polling if EventSource is blocked
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

    // Initial check + lightweight 4s fallback check (30 bytes only)
    if (role === 'teacher') {
      checkTeacherActions();
      pollTimer = window.setInterval(checkTeacherActions, 3500);
    } else {
      checkStudentState(true);
      pollTimer = window.setInterval(() => checkStudentState(false), 4000);
    }

    return () => {
      isClosed = true;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      if (eventSource) {
        try {
          eventSource.close();
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
