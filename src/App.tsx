import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveAppView } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { ClassroomRulesModal } from './components/ClassroomRulesModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentPortal } from './components/StudentPortal';
import { PrintableCards } from './components/PrintableCards';
import { ClassroomStoreView } from './components/ClassroomStoreView';
import { EnglishDailyDollarsSection } from './components/EnglishDailyDollarsSection';
import { SettingsModal } from './components/SettingsModal';
import { DataBackupModal } from './components/DataBackupModal';
import { ClassManagerModal } from './components/ClassManagerModal';
import { StudentReportsModal } from './components/StudentReportsModal';
import { TeacherApprovalCenterModal } from './components/TeacherApprovalCenterModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ContractsWallView } from './components/ContractsWallView';
import { formatStoreAllocationsSummary } from './components/StoreRedemptionConfigModal';
import { StudentWebApp } from './components/student-web/StudentWebApp';
import {
  Student,
  Loan,
  TeacherSettings,
  EnglishSubmission,
  EnglishRewardTransaction,
  StoreItem,
  StorePurchaseTransaction,
  StoreRedemptionAllocation,
  Classroom,
  ClassroomContract,
  BalanceAdjustmentTransaction,
  CreditLimitRaiseTransaction,
  PendingStudentRequest,
  BalanceDisclaimerNotice,
  P2PTransferRecord,
} from './types';
import {
  CloudClassroomState,
  StudentActionPayload,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  normalizeSupabaseUrl,
  pushClassroomStateToCloud,
  subscribeToClassroomRealtime,
  getConfiguredCloudDbUrl,
  getConfiguredSupabaseKey,
  fetchClassroomStateFromCloud,
  removeCloudStudentAction,
} from './services/cloudSync';
import { INITIAL_STUDENTS, INITIAL_LOANS } from './data/initialData';
import { loadClassrooms, saveClassrooms } from './data/classrooms';
import {
  DEFAULT_TEACHER_SETTINGS,
  calculateEffectiveInterest,
  calculateTotalDue,
  getCreditTier,
  getTodayDateString,
} from './utils/creditCalculator';
import { loadStoreCatalog, saveStoreCatalog } from './data/storeCatalog';
import { CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

const INITIAL_CONTRACTS: ClassroomContract[] = [
  {
    id: 'contract-initial-1',
    title: 'Weekend Story Challenge: 10 Past Tense Sentences',
    instructions:
      'Write 10 original sentences in your notebook about your weekend using past tense verbs and highlight each verb. Take a clear photo of your notebook page!',
    rewardAmount: 150,
    creditScoreBonus: 15,
    totalStock: 5,
    spotsRemaining: 5,
    classroomId: 'all',
    isActive: true,
    createdAt: new Date().toISOString(),
    claims: [],
  },
  {
    id: 'contract-initial-2',
    title: 'Phrasal Verbs Master: 4 Illustrated Phrasal Verbs',
    instructions:
      'Choose 4 phrasal verbs from class, write a full example sentence for each in your notebook, and add a small drawing or border decoration. Upload a photo to claim!',
    rewardAmount: 220,
    creditScoreBonus: 20,
    totalStock: 3,
    spotsRemaining: 3,
    classroomId: 'all',
    isActive: true,
    createdAt: new Date().toISOString(),
    claims: [],
  },
];

export default function App() {
  // Theme state with localStorage persistence ('dark' by default)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('esl_classroom_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('esl_classroom_theme', next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Sync HTML class for Tailwind v4 dark/light themes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Local storage state initialization
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('esl_classroom_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem('esl_classroom_loans');
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [settings, setSettings] = useState<TeacherSettings>(() => {
    try {
      const saved = localStorage.getItem('esl_classroom_settings');
      if (saved) {
        const parsed = JSON.parse(saved) as TeacherSettings;
        return {
          ...DEFAULT_TEACHER_SETTINGS,
          ...parsed,
          cloudDatabaseUrl: normalizeSupabaseUrl(
            parsed.cloudDatabaseUrl || DEFAULT_SUPABASE_URL
          ),
          cloudSupabaseKey: parsed.cloudSupabaseKey || DEFAULT_SUPABASE_ANON_KEY,
        };
      }
      return DEFAULT_TEACHER_SETTINGS;
    } catch {
      return DEFAULT_TEACHER_SETTINGS;
    }
  });

  const [currentView, setCurrentView] = useState<ActiveAppView>('teacher');
  const [storeCatalog, setStoreCatalog] = useState<StoreItem[]>(() => loadStoreCatalog());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-1'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [printTargetStudentId, setPrintTargetStudentId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isClassManagerModalOpen, setIsClassManagerModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isApprovalCenterOpen, setIsApprovalCenterOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => loadClassrooms());

  const [pendingRequests, setPendingRequests] = useState<PendingStudentRequest[]>(() => {
    try {
      const saved = localStorage.getItem('esl_classroom_pending_requests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [contracts, setContracts] = useState<ClassroomContract[]>(() => {
    try {
      const saved = localStorage.getItem('esl_classroom_contracts_v1');
      return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
    } catch {
      return INITIAL_CONTRACTS;
    }
  });

  const isStandaloneStudentWeb = React.useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'student') return true;
      if (params.get('portal') === 'teacher') return false;
      if (window.location.hostname.endsWith('github.io')) return true;
    } catch {
      // ignore
    }
    const envMode = (import.meta as unknown as { env?: Record<string, string> }).env
      ?.VITE_APP_MODE;
    return envMode === 'student';
  }, []);

  // Sync store catalog to localStorage
  useEffect(() => {
    saveStoreCatalog(storeCatalog);
  }, [storeCatalog]);

  // Sync classrooms to localStorage
  useEffect(() => {
    saveClassrooms(classrooms);
  }, [classrooms]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('esl_classroom_students', JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('esl_classroom_loans', JSON.stringify(loans));
    } catch (e) {
      console.error(e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem('esl_classroom_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('esl_classroom_pending_requests', JSON.stringify(pendingRequests));
    } catch (e) {
      console.error(e);
    }
  }, [pendingRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('esl_classroom_contracts_v1', JSON.stringify(contracts));
    } catch (e) {
      console.error(e);
    }
  }, [contracts]);

  // Toast Helper
  const addToast = (type: 'success' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to build a BalanceDisclaimerNotice whenever a student's balance changes
  const buildBalanceDisclaimer = (
    studentId: string,
    previousBalance: number,
    newBalance: number,
    reason: string,
    category: BalanceDisclaimerNotice['category']
  ): BalanceDisclaimerNotice => ({
    id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    studentId,
    previousBalance,
    newBalance,
    delta: newBalance - previousBalance,
    reason,
    category,
    createdAt: new Date().toISOString(),
  });

  // Hydrate & merge any recent Student Web App updates from Supabase on Teacher startup
  const [hasHydratedFromCloud, setHasHydratedFromCloud] = useState(false);

  useEffect(() => {
    if (isStandaloneStudentWeb) return;
    let cancelled = false;

    const cleanUrl = normalizeSupabaseUrl(settings.cloudDatabaseUrl || DEFAULT_SUPABASE_URL);
    const cleanKey = settings.cloudSupabaseKey || DEFAULT_SUPABASE_ANON_KEY;
    if (cleanUrl !== settings.cloudDatabaseUrl || cleanKey !== settings.cloudSupabaseKey) {
      setSettings((prev) => ({
        ...prev,
        cloudDatabaseUrl: cleanUrl,
        cloudSupabaseKey: cleanKey,
      }));
    }

    const hydrateOnStartup = async () => {
      try {
        const res = await fetchClassroomStateFromCloud(cleanUrl, cleanKey);
        if (cancelled) return;

        if (res.source === 'cloud' && res.state) {
          const cloud = res.state;
          const isLocalDefaultSample =
            students.length <= INITIAL_STUDENTS.length &&
            cloud.students.length > INITIAL_STUDENTS.length;

          if (isLocalDefaultSample) {
            setStudents(cloud.students);
            setLoans(cloud.loans || []);
            if (cloud.storeCatalog?.length) setStoreCatalog(cloud.storeCatalog);
            if (cloud.classrooms?.length) setClassrooms(cloud.classrooms);
            if (cloud.pendingRequests?.length) setPendingRequests(cloud.pendingRequests);
            if (cloud.contracts?.length) setContracts(cloud.contracts);
          } else {
            // Merge any student profile updates, P2P transfers, and active loans from cloud
            if (Array.isArray(cloud.students) && cloud.students.length > 0) {
              const cloudStudentMap = new Map(cloud.students.map((cs) => [cs.id, cs]));
              setStudents((prev) =>
                prev.map((localSt) => {
                  const remoteSt = cloudStudentMap.get(localSt.id);
                  if (!remoteSt) return localSt;

                  // Merge any new P2P postal cards that arrived while ATM 4.0 was closed
                  const localP2P = localSt.p2pTransfersHistory || [];
                  const localP2PBaseIds = new Set(
                    localP2P.map((t) => t.id.replace(/_(sent|received)$/, ''))
                  );
                  const newRemoteP2P = (remoteSt.p2pTransfersHistory || []).filter(
                    (t) => !localP2PBaseIds.has(t.id.replace(/_(sent|received)$/, ''))
                  );
                  const p2pDelta = newRemoteP2P.reduce(
                    (sum, t) => sum + (t.direction === 'received' ? t.amount : -t.amount),
                    0
                  );

                  // Also sync any quickReply updates on existing P2P transfers
                  const remoteP2PByBaseId = new Map(
                    (remoteSt.p2pTransfersHistory || []).map((t) => [
                      t.id.replace(/_(sent|received)$/, ''),
                      t,
                    ])
                  );
                  const updatedLocalP2P = localP2P.map((t) => {
                    const remoteMatch = remoteP2PByBaseId.get(
                      t.id.replace(/_(sent|received)$/, '')
                    );
                    if (remoteMatch?.quickReply && !t.quickReply) {
                      return {
                        ...t,
                        quickReply: remoteMatch.quickReply,
                        repliedAt: remoteMatch.repliedAt,
                      };
                    }
                    return t;
                  });

                  // Merge disclaimers
                  const localDiscIds = new Set((localSt.disclaimers || []).map((d) => d.id));
                  const extraDisclaimers = (remoteSt.disclaimers || []).filter(
                    (d) => !localDiscIds.has(d.id)
                  );

                  return {
                    ...localSt,
                    avatarUrl: remoteSt.avatarUrl ?? localSt.avatarUrl,
                    customPassword: remoteSt.customPassword ?? localSt.customPassword,
                    activeLoanId: localSt.activeLoanId || remoteSt.activeLoanId || null,
                    currentBalance: Math.max(0, localSt.currentBalance + p2pDelta),
                    p2pTransfersHistory: [...newRemoteP2P, ...updatedLocalP2P],
                    disclaimers: [...extraDisclaimers, ...(localSt.disclaimers || [])],
                    reservedBalance: Math.max(
                      localSt.reservedBalance || 0,
                      remoteSt.reservedBalance || 0
                    ),
                  };
                })
              );
            }

            // Merge any loans opened while ATM 4.0 was closed
            if (Array.isArray(cloud.loans) && cloud.loans.length > 0) {
              setLoans((prev) => {
                const existingIds = new Set(prev.map((l) => l.id));
                const newLoansFromCloud = cloud.loans.filter((l) => !existingIds.has(l.id));
                return newLoansFromCloud.length > 0 ? [...newLoansFromCloud, ...prev] : prev;
              });
            }

            // Merge any pending requests submitted while ATM 4.0 was closed
            if (Array.isArray(cloud.pendingRequests) && cloud.pendingRequests.length > 0) {
              setPendingRequests((prev) => {
                const existingIds = new Set(prev.map((r) => r.id));
                const newFromCloud = cloud.pendingRequests.filter(
                  (r) => !existingIds.has(r.id)
                );
                return newFromCloud.length > 0 ? [...newFromCloud, ...prev] : prev;
              });
            }

            // Merge any contracts / claims updated in cloud (and recalculate spotsRemaining)
            if (Array.isArray(cloud.contracts) && cloud.contracts.length > 0) {
              setContracts((prev) => {
                const cloudMap = new Map(cloud.contracts!.map((c) => [c.id, c]));
                const merged = prev.map((localC) => {
                  const remoteC = cloudMap.get(localC.id);
                  if (!remoteC) return localC;
                  const claimIds = new Set(localC.claims.map((cl) => cl.id));
                  const claimStudentIds = new Set(localC.claims.map((cl) => cl.studentId));
                  const extraClaims = (remoteC.claims || []).filter(
                    (cl) => !claimIds.has(cl.id) && !claimStudentIds.has(cl.studentId)
                  );
                  const mergedClaims = [...localC.claims, ...extraClaims];
                  return {
                    ...localC,
                    spotsRemaining: Math.max(0, localC.totalStock - mergedClaims.length),
                    claims: mergedClaims,
                  };
                });
                const localIds = new Set(prev.map((c) => c.id));
                const extraContracts = cloud.contracts!.filter((c) => !localIds.has(c.id));
                return [...merged, ...extraContracts];
              });
            }
          }
        }
      } catch {
        // ignore startup hydration error
      } finally {
        if (!cancelled) {
          setHasHydratedFromCloud(true);
        }
      }
    };

    hydrateOnStartup();
    return () => {
      cancelled = true;
    };
  }, [isStandaloneStudentWeb]);

  // Push classroom state to Cloud & Local BroadcastChannel whenever state changes in Teacher Mode
  useEffect(() => {
    if (isStandaloneStudentWeb || !hasHydratedFromCloud) return;
    const statePayload: CloudClassroomState = {
      version: 4,
      updatedAt: new Date().toISOString(),
      students,
      loans,
      storeCatalog,
      classrooms,
      settings,
      pendingRequests,
      contracts,
    };
    const timer = window.setTimeout(() => {
      pushClassroomStateToCloud(
        statePayload,
        settings.cloudDatabaseUrl,
        settings.cloudSupabaseKey
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [
    isStandaloneStudentWeb,
    hasHydratedFromCloud,
    students,
    loans,
    storeCatalog,
    classrooms,
    settings,
    pendingRequests,
    contracts,
  ]);

  // Listen for real-time Student Web App actions in Teacher Mode
  useEffect(() => {
    if (isStandaloneStudentWeb) return;

    const handleIncomingStudentAction = (action: StudentActionPayload) => {
      if (action.type === 'UPDATE_PROFILE') {
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== action.studentId) return s;
            return {
              ...s,
              avatarUrl: action.avatarUrl !== undefined ? action.avatarUrl : s.avatarUrl,
              customPassword:
                action.customPassword !== undefined ? action.customPassword : s.customPassword,
            };
          })
        );
      } else if (action.type === 'ACKNOWLEDGE_DISCLAIMERS') {
        const ackTime = new Date().toISOString();
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== action.studentId) return s;
            return {
              ...s,
              disclaimers: (s.disclaimers || []).map((d) =>
                action.disclaimerIds.includes(d.id) && !d.acknowledgedAt
                  ? { ...d, acknowledgedAt: ackTime }
                  : d
              ),
            };
          })
        );
      } else if (action.type === 'OPEN_LOAN') {
        const newLoan: Loan = { ...action.loan, principalDisbursed: false };
        setLoans((prev) => {
          if (prev.some((l) => l.id === newLoan.id)) return prev;
          return [newLoan, ...prev];
        });
        setStudents((prev) =>
          prev.map((s) => (s.id === newLoan.studentId ? { ...s, activeLoanId: newLoan.id } : s))
        );
        addToast(
          'info',
          '🏦 Student Opened a Loan',
          `Loan for E$${newLoan.principal}.00 opened! E$${newLoan.principal}.00 will disburse into their wallet once you approve their English notebook work.`
        );
        removeCloudStudentAction(
          action.id,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      } else if (action.type === 'SEND_P2P_POSTCARD') {
        const nowIso = action.createdAt || new Date().toISOString();
        const baseId = action.transferId.replace(/_(sent|received)$/, '');
        setStudents((prev) => {
          const sender = prev.find((s) => s.id === action.senderId);
          const recipient = prev.find((s) => s.id === action.recipientId);
          if (!sender || !recipient) return prev;
          if (
            (sender.p2pTransfersHistory || []).some(
              (t) => t.id === baseId || t.id === `${baseId}_sent` || t.id === action.transferId
            )
          ) {
            return prev;
          }
          const senderNewBal = Math.max(0, sender.currentBalance - action.amount);
          const recipientNewBal = recipient.currentBalance + action.amount;

          const sentRecord: P2PTransferRecord = {
            id: baseId,
            direction: 'sent',
            counterpartyId: recipient.id,
            counterpartyName: recipient.name,
            counterpartyClassName: recipient.className,
            amount: action.amount,
            message: 'To you - from me',
            isPostalCard: true,
            timestamp: nowIso,
          };

          const receivedRecord: P2PTransferRecord = {
            id: baseId,
            direction: 'received',
            counterpartyId: sender.id,
            counterpartyName: sender.name,
            counterpartyClassName: sender.className,
            amount: action.amount,
            message: 'To you - from me',
            isPostalCard: true,
            timestamp: nowIso,
          };

          const senderDisc: BalanceDisclaimerNotice = {
            id: `disc-p2p-sent-${baseId}`,
            studentId: sender.id,
            previousBalance: sender.currentBalance,
            newBalance: senderNewBal,
            delta: -action.amount,
            reason: `🎁 Gift Postal Card sent to ${recipient.name}: "To you - from me"`,
            category: 'transfer',
            createdAt: nowIso,
          };

          const recipientDisc: BalanceDisclaimerNotice = {
            id: `disc-p2p-recv-${baseId}`,
            studentId: recipient.id,
            previousBalance: recipient.currentBalance,
            newBalance: recipientNewBal,
            delta: action.amount,
            reason: `🎁 Gift Postal Card received from ${sender.name}: "To you - from me"`,
            category: 'transfer',
            createdAt: nowIso,
          };

          addToast(
            'info',
            '🎁 Gift Postal Card Sent',
            `${sender.name} sent an E$${action.amount}.00 Gift Postal Card ("To you - from me") to ${recipient.name}.`
          );

          return prev.map((s) => {
            if (s.id === sender.id) {
              return {
                ...s,
                currentBalance: senderNewBal,
                p2pTransfersHistory: [sentRecord, ...(s.p2pTransfersHistory || [])],
                disclaimers: [
                  senderDisc,
                  ...(s.disclaimers || []).filter((d) => d.id !== `disc-p2p-sent-${baseId}`),
                ],
              };
            }
            if (s.id === recipient.id) {
              return {
                ...s,
                currentBalance: recipientNewBal,
                p2pTransfersHistory: [receivedRecord, ...(s.p2pTransfersHistory || [])],
                disclaimers: [
                  recipientDisc,
                  ...(s.disclaimers || []).filter((d) => d.id !== `disc-p2p-recv-${baseId}`),
                ],
              };
            }
            return s;
          });
        });
        removeCloudStudentAction(
          action.id,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      } else if (action.type === 'REPLY_P2P_POSTCARD') {
        const nowIso = action.createdAt || new Date().toISOString();
        const baseId = action.transferId.replace(/_(sent|received)$/, '');
        const matchesTransfer = (id: string) =>
          id === baseId ||
          id === `${baseId}_sent` ||
          id === `${baseId}_received` ||
          id === action.transferId;
        setStudents((prev) => {
          const sender = prev.find((s) => s.id === action.senderId);
          const existing = (sender?.p2pTransfersHistory || []).find((t) => matchesTransfer(t.id));
          if (existing?.quickReply === action.replyText) {
            return prev;
          }
          const recipient = prev.find((s) => s.id === action.recipientId);
          return prev.map((s) => {
            if (s.id === action.recipientId) {
              return {
                ...s,
                p2pTransfersHistory: (s.p2pTransfersHistory || []).map((t) =>
                  matchesTransfer(t.id)
                    ? { ...t, quickReply: action.replyText, repliedAt: nowIso }
                    : t
                ),
              };
            }
            if (s.id === action.senderId) {
              const replyDisc: BalanceDisclaimerNotice = {
                id: `disc-p2p-reply-${baseId}`,
                studentId: s.id,
                previousBalance: s.currentBalance,
                newBalance: s.currentBalance,
                delta: 0,
                reason: `💌 ${recipient?.name || action.recipientName || 'Your classmate'} replied to your Gift Postal Card: "${action.replyText}"`,
                category: 'transfer',
                createdAt: nowIso,
              };
              return {
                ...s,
                p2pTransfersHistory: (s.p2pTransfersHistory || []).map((t) =>
                  matchesTransfer(t.id)
                    ? { ...t, quickReply: action.replyText, repliedAt: nowIso }
                    : t
                ),
                disclaimers: [
                  replyDisc,
                  ...(s.disclaimers || []).filter(
                    (d) =>
                      d.id !== `disc-p2p-reply-${baseId}` &&
                      d.id !== `disc-p2p-reply-${action.transferId}`
                  ),
                ],
              };
            }
            return s;
          });
        });
        removeCloudStudentAction(
          action.id,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      } else if (action.type === 'RESERVE_CONTRACT') {
        setContracts((prev) =>
          prev.map((c) => {
            if (c.id !== action.contractId || !c.isActive) return c;
            if (
              c.claims.some(
                (cl) => cl.id === action.claim.id || cl.studentId === action.claim.studentId
              )
            ) {
              return c;
            }
            if (c.spotsRemaining <= 0 || c.claims.length >= c.totalStock) return c;
            const nextClaims = [action.claim, ...c.claims];
            return {
              ...c,
              spotsRemaining: Math.max(0, c.totalStock - nextClaims.length),
              claims: nextClaims,
            };
          })
        );
        addToast(
          'info',
          '📜 Contract Spot Reserved',
          `${action.claim.studentName} reserved a spot on the Contracts Wall!`
        );
        removeCloudStudentAction(
          action.id,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      } else if (action.type === 'RELEASE_CONTRACT') {
        setContracts((prev) =>
          prev.map((c) => {
            if (c.id !== action.contractId) return c;
            const existingClaim = c.claims.find(
              (cl) =>
                (action.claimId ? cl.id === action.claimId : cl.studentId === action.studentId) &&
                cl.status !== 'approved'
            );
            if (!existingClaim) return c;
            const nextClaims = c.claims.filter((cl) => cl.id !== existingClaim.id);
            return {
              ...c,
              spotsRemaining: Math.min(c.totalStock, Math.max(0, c.totalStock - nextClaims.length)),
              claims: nextClaims,
            };
          })
        );
        setPendingRequests((prev) => {
          const toRemove = prev.filter(
            (r) =>
              r.type === 'contract_submission' &&
              r.status === 'pending' &&
              (r.contractSubmissionData?.claimId === action.claimId ||
                (r.studentId === action.studentId &&
                  r.contractSubmissionData?.contractId === action.contractId))
          );
          toRemove.forEach((r) => {
            removeCloudStudentAction(
              `act_${r.id}`,
              settings.cloudDatabaseUrl,
              settings.cloudSupabaseKey
            );
          });
          return prev.filter((r) => !toRemove.some((rem) => rem.id === r.id));
        });
        removeCloudStudentAction(
          `act_res_${action.claimId}`,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
        removeCloudStudentAction(
          action.id,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      } else if (action.type === 'SUBMIT_REQUEST') {
        const req = action.request;
        setPendingRequests((prev) => {
          const existing = prev.find((r) => r.id === req.id);
          if (existing) {
            if (existing.status !== 'pending') {
              removeCloudStudentAction(
                `act_${req.id}`,
                settings.cloudDatabaseUrl,
                settings.cloudSupabaseKey
              );
            }
            return prev;
          }
          if (req.reservedAmount > 0) {
            setStudents((stPrev) =>
              stPrev.map((s) =>
                s.id === req.studentId
                  ? { ...s, reservedBalance: (s.reservedBalance || 0) + req.reservedAmount }
                  : s
              )
            );
          }
          if (req.type === 'contract_submission' && req.contractSubmissionData) {
            const subData = req.contractSubmissionData;
            setContracts((cPrev) =>
              cPrev.map((c) => {
                if (c.id !== subData.contractId) return c;
                return {
                  ...c,
                  claims: c.claims.map((cl) =>
                    cl.id === subData.claimId || cl.studentId === req.studentId
                      ? {
                          ...cl,
                          status: 'pending_approval',
                          submittedAt: req.createdAt,
                          notebookPhotoDataUrl: subData.notebookPhotoDataUrl,
                          studentNotes: subData.studentNotes,
                        }
                      : cl
                  ),
                };
              })
            );
          }
          const labelMap: Record<PendingStudentRequest['type'], string> = {
            loan_payment: 'Notebook Photo Loan Payment',
            loan_request: 'New Loan Request',
            store_purchase: 'School Store Order',
            p2p_transfer: 'Friend Money Transfer',
            contract_submission: 'Contract Notebook Photo',
          };
          addToast(
            'info',
            `📲 New ${labelMap[req.type]}`,
            `${req.studentName} submitted a request from the Student Web App. Click Approvals to review!`
          );
          return [req, ...prev];
        });
      } else if (action.type === 'CANCEL_REQUEST') {
        setPendingRequests((prev) => {
          const target = prev.find((r) => r.id === action.requestId && r.status === 'pending');
          if (target && target.reservedAmount > 0) {
            setStudents((stPrev) =>
              stPrev.map((s) =>
                s.id === target.studentId
                  ? {
                      ...s,
                      reservedBalance: Math.max(
                        0,
                        (s.reservedBalance || 0) - target.reservedAmount
                      ),
                    }
                  : s
              )
            );
          }
          if (target && target.type === 'contract_submission' && target.contractSubmissionData) {
            const subData = target.contractSubmissionData;
            setContracts((cPrev) =>
              cPrev.map((c) => {
                if (c.id !== subData.contractId) return c;
                return {
                  ...c,
                  claims: c.claims.map((cl) =>
                    cl.id === subData.claimId ? { ...cl, status: 'reserved' } : cl
                  ),
                };
              })
            );
          }
          return prev.filter((r) => r.id !== action.requestId);
        });
      }
    };

    const unsubscribe = subscribeToClassroomRealtime({
      role: 'teacher',
      dbUrl: getConfiguredCloudDbUrl(settings.cloudDatabaseUrl),
      supabaseKey: getConfiguredSupabaseKey(settings.cloudSupabaseKey),
      onStudentAction: handleIncomingStudentAction,
    });

    return () => unsubscribe();
  }, [isStandaloneStudentWeb, settings.cloudDatabaseUrl, settings.cloudSupabaseKey]);

  // Switch to student view from teacher row
  const handleSwitchToStudentView = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView('student');
  };

  // Adjust student credit limit
  const handleUpdateCreditLimit = (studentId: string, newLimit: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, maxLoanLimit: newLimit } : s))
    );
    const student = students.find((s) => s.id === studentId);
    addToast(
      'success',
      'Loan Limit Updated',
      `Max loan limit for ${student?.name || 'Student'} adjusted to E$${newLimit}.`
    );
  };

  // Grant custom credit limit raise to student (with optional credit score bonus)
  const handleGrantCreditLimitRaise = (
    studentId: string,
    newLimit: number,
    reason: string,
    creditScoreBonus: number = 0
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const prevLimit = student.maxLoanLimit;
    const oldScore = student.creditScore;
    const newScore = Math.min(850, Math.max(300, oldScore + (creditScoreBonus || 0)));

    const raiseRecord: CreditLimitRaiseTransaction = {
      id: `raise_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      previousLimit: prevLimit,
      newLimit,
      increaseAmount: Math.max(0, newLimit - prevLimit),
      reason: reason || 'Teacher discretionary credit limit raise',
      grantedBy: 'Teacher',
      creditScoreBonus: creditScoreBonus || 0,
      timestamp: new Date().toISOString(),
    };

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              maxLoanLimit: newLimit,
              creditScore: newScore,
              creditLimitRaisesHistory: [raiseRecord, ...(s.creditLimitRaisesHistory || [])],
            }
          : s
      )
    );

    const bonusNote = creditScoreBonus > 0 ? ` (+${creditScoreBonus} credit score bonus)` : '';
    addToast(
      'success',
      'Credit Limit Rise Granted! 🚀',
      `${student.name}'s loan limit raised from E$${prevLimit} to E$${newLimit}${bonusNote}.`
    );
  };

  // Update payment frequency
  const handleUpdatePaymentFrequency = (studentId: string, freq: 'monthly' | 'bimonthly') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, paymentFrequency: freq } : s))
    );
    const planText = freq === 'monthly' ? `$${settings.monthlyPayment}/mo` : `$${settings.bimonthlyPayment}/bi-weekly`;
    addToast('info', 'Payment Plan Changed', `Payment frequency set to ${planText}.`);
  };

  // Delist student (permanently decline credit card)
  const handleDelistStudent = (studentId: string, reason: string) => {
    const student = students.find((s) => s.id === studentId);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              cardStatus: 'delisted',
              delistedReason: reason,
              delistedAt: new Date().toISOString(),
              maxLoanLimit: 0,
            }
          : s
      )
    );

    // Also mark active loans as defaulted
    setLoans((prev) =>
      prev.map((l) =>
        l.studentId === studentId && (l.status === 'active' || l.status === 'pending_review')
          ? { ...l, status: 'defaulted' }
          : l
      )
    );

    addToast(
      'warning',
      'Card Declined Forever & Delisted',
      `${student?.name || 'Student'}'s card has been permanently revoked.`
    );
  };

  // Reinstate student (teacher mercy)
  const handleReinstateStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              cardStatus: 'active',
              delistedReason: undefined,
              delistedAt: undefined,
              creditScore: 560,
              maxLoanLimit: settings.startingLoanLimit,
            }
          : s
      )
    );
    addToast('success', 'Card Reinstated', 'Student has been granted an active card.');
  };

  // Permanently erase student
  const handleDeleteStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const studentName = student ? student.name : 'Student';

    // Remove from students
    setStudents((prev) => prev.filter((s) => s.id !== studentId));

    // Remove loans
    setLoans((prev) => prev.filter((l) => l.studentId !== studentId));

    // Adjust selectedStudentId if needed
    setSelectedStudentId((prev) => {
      if (prev === studentId) {
        const remaining = students.filter((s) => s.id !== studentId);
        return remaining[0]?.id || '';
      }
      return prev;
    });

    addToast(
      'success',
      'Student Record Erased',
      `${studentName} has been permanently deleted from the classroom roster.`
    );
  };

  // Manually reduce student balance (for classroom store purchases) with credit score boost!
  const handleReduceStudentBalance = (
    studentId: string,
    amountToDeduct: number,
    reason?: string,
    storeDetails?: {
      itemId?: string;
      itemName: string;
      originalPrice: number;
      discountPercent: number;
      quantity?: number;
      allocations?: StoreRedemptionAllocation[];
    }
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (amountToDeduct <= 0) {
      addToast('warning', 'Invalid Amount', 'Please enter a deduction amount greater than $0.');
      return;
    }

    if (student.currentBalance < amountToDeduct) {
      addToast(
        'warning',
        'Insufficient Balance',
        `${student.name} only has $${student.currentBalance}.00 available.`
      );
      return;
    }

    const newBalance = student.currentBalance - amountToDeduct;

    // Credit score bonus on store purchase (+5 points, capped at 850)
    const scoreBonus = 5;
    const oldScore = student.creditScore;
    const newScore = Math.min(850, oldScore + scoreBonus);

    const qty = storeDetails?.quantity || 1;

    // If purchase was tied to a catalog item with limited stock, decrement stock by quantity
    if (storeDetails?.itemId) {
      setStoreCatalog((prevCatalog) =>
        prevCatalog.map((item) => {
          if (item.id !== storeDetails.itemId) return item;
          if (item.unlimitedStock) return item;
          return { ...item, stock: Math.max(0, item.stock - qty) };
        })
      );
    }

    const allocSummary = formatStoreAllocationsSummary(storeDetails?.allocations);
    const fullItemName = `${storeDetails?.itemName || reason || 'Classroom Store Purchase'}${
      qty > 1 ? ` (x${qty})` : ''
    }${allocSummary ? ` [${allocSummary}]` : ''}`;

    const purchaseRecord: StorePurchaseTransaction = {
      id: `purch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      itemId: storeDetails?.itemId,
      itemName: fullItemName,
      pricePaid: amountToDeduct,
      originalPrice: storeDetails?.originalPrice || amountToDeduct,
      discountPercent: storeDetails?.discountPercent || 0,
      quantity: qty,
      creditScoreBonusAwarded: scoreBonus,
      allocations: storeDetails?.allocations,
      timestamp: new Date().toISOString(),
    };

    const disclaimer = buildBalanceDisclaimer(
      student.id,
      student.currentBalance,
      newBalance,
      `Store Purchase: ${purchaseRecord.itemName} • Your request will be done asap - Teacher Anthony's ATM`,
      'store'
    );

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentBalance: newBalance,
              creditScore: newScore,
              totalStorePurchasesCount: (s.totalStorePurchasesCount || 0) + qty,
              storePurchasesHistory: [purchaseRecord, ...(s.storePurchasesHistory || [])],
              disclaimers: [disclaimer, ...(s.disclaimers || [])],
            }
          : s
      )
    );

    addToast(
      'success',
      'Store Purchase Charged (+5 Credit Score)',
      `Charged E$${amountToDeduct}.00 from ${student.name} for ${purchaseRecord.itemName}. Credit score increased: ${oldScore} → ${newScore} (+${scoreBonus} pts)!`
    );
  };

  // Multi-item Cart Checkout Handler (Batch purchasing multiple items / quantities at once)
  const handleCheckoutCart = (
    studentId: string,
    cartItems: {
      item: StoreItem;
      quantity: number;
      effectiveUnitPrice: number;
      allocations?: StoreRedemptionAllocation[];
    }[]
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const totalAmount = cartItems.reduce(
      (sum, c) => sum + c.effectiveUnitPrice * c.quantity,
      0
    );
    const totalItemsCount = cartItems.reduce((sum, c) => sum + c.quantity, 0);

    if (totalAmount <= 0 || totalItemsCount <= 0) {
      addToast('warning', 'Cart Empty', 'Please select items to purchase.');
      return;
    }

    if (student.currentBalance < totalAmount) {
      addToast(
        'warning',
        'Insufficient Balance',
        `${student.name} needs E$${totalAmount}.00 but only has E$${student.currentBalance}.00 available.`
      );
      return;
    }

    const newBalance = student.currentBalance - totalAmount;
    const scoreBonus = Math.min(25, 5 * cartItems.length); // +5 per item type up to 25
    const oldScore = student.creditScore;
    const newScore = Math.min(850, oldScore + scoreBonus);

    // Decrement stock for all cart items
    setStoreCatalog((prevCatalog) =>
      prevCatalog.map((catItem) => {
        const inCart = cartItems.find((c) => c.item.id === catItem.id);
        if (!inCart || catItem.unlimitedStock) return catItem;
        return {
          ...catItem,
          stock: Math.max(0, catItem.stock - inCart.quantity),
        };
      })
    );

    const timestamp = new Date().toISOString();
    const purchaseRecords: StorePurchaseTransaction[] = cartItems.map((c) => {
      const allocSummary = formatStoreAllocationsSummary(c.allocations);
      return {
        id: `purch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        studentId: student.id,
        studentName: student.name,
        itemId: c.item.id,
        itemName: `${c.item.name}${c.quantity > 1 ? ` (x${c.quantity})` : ''}${
          allocSummary ? ` [${allocSummary}]` : ''
        }`,
        pricePaid: c.effectiveUnitPrice * c.quantity,
        originalPrice: c.item.basePrice * c.quantity,
        discountPercent: c.item.discountPercent || 0,
        quantity: c.quantity,
        creditScoreBonusAwarded: 5,
        allocations: c.allocations,
        timestamp,
      };
    });

    const cartDisclaimer = buildBalanceDisclaimer(
      student.id,
      student.currentBalance,
      newBalance,
      `Store Cart Purchase (${purchaseRecords.map((p) => p.itemName).join('; ')}) • Your request will be done asap - Teacher Anthony's ATM`,
      'store'
    );

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentBalance: newBalance,
              creditScore: newScore,
              totalStorePurchasesCount: (s.totalStorePurchasesCount || 0) + totalItemsCount,
              storePurchasesHistory: [...purchaseRecords, ...(s.storePurchasesHistory || [])],
              disclaimers: [cartDisclaimer, ...(s.disclaimers || [])],
            }
          : s
      )
    );

    addToast(
      'success',
      'Cart Checkout Complete (+Credit Score)',
      `Purchased ${totalItemsCount} item(s) for E$${totalAmount}.00 from ${student.name}. Score increased: ${oldScore} → ${newScore} (+${scoreBonus} pts)!`
    );
  };

  // Manual Balance Adjustment (increase or reduce student money)
  const handleManualAdjustBalance = (
    studentId: string,
    type: 'increase' | 'decrease',
    amount: number,
    reason: string,
    category: BalanceAdjustmentTransaction['category'] = 'reward',
    creditScoreChange: number = 0
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (amount <= 0) {
      addToast('warning', 'Invalid Amount', 'Adjustment amount must be greater than 0.');
      return;
    }

    if (type === 'decrease' && student.currentBalance < amount) {
      addToast('warning', 'Insufficient Funds', `${student.name} only has E$${student.currentBalance}.00 available.`);
      return;
    }

    const prevBalance = student.currentBalance;
    const newBalance = type === 'increase' ? prevBalance + amount : prevBalance - amount;
    const oldScore = student.creditScore;
    const newScore = Math.max(300, Math.min(850, oldScore + creditScoreChange));

    const adjustmentTx: BalanceAdjustmentTransaction = {
      id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      type,
      amount,
      previousBalance: prevBalance,
      newBalance,
      reason: reason || (type === 'increase' ? 'Manual balance credit' : 'Manual balance deduction'),
      category,
      creditScoreChange,
      timestamp: new Date().toISOString(),
    };

    const manualDisclaimer = buildBalanceDisclaimer(
      student.id,
      prevBalance,
      newBalance,
      adjustmentTx.reason,
      type === 'increase' ? 'reward' : 'fine'
    );

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentBalance: newBalance,
              creditScore: newScore,
              balanceAdjustmentsHistory: [adjustmentTx, ...(s.balanceAdjustmentsHistory || [])],
              disclaimers: [manualDisclaimer, ...(s.disclaimers || [])],
            }
          : s
      )
    );

    const typeLabel = type === 'increase' ? `+E$${amount}` : `-E$${amount}`;
    const scoreNote = creditScoreChange !== 0 ? ` (Credit score: ${oldScore} → ${newScore})` : '';
    addToast(
      'success',
      `Balance ${type === 'increase' ? 'Credited' : 'Deducted'}`,
      `${typeLabel} adjusted for ${student.name} (${adjustmentTx.reason})${scoreNote}.`
    );
  };

  // Bulk Balance Adjustment (award or deduct money across multiple selected students)
  const handleBulkAdjustBalance = (
    studentIds: string[],
    amount: number,
    type: 'increase' | 'reduce',
    reason: string
  ) => {
    if (!studentIds || studentIds.length === 0) {
      addToast('warning', 'No Students Selected', 'Please select at least one student.');
      return;
    }
    if (amount <= 0) {
      addToast('warning', 'Invalid Amount', 'Adjustment amount must be greater than 0.');
      return;
    }

    const targetType: 'increase' | 'decrease' = type === 'reduce' ? 'decrease' : 'increase';

    setStudents((prev) =>
      prev.map((s) => {
        if (!studentIds.includes(s.id)) return s;

        const prevBalance = s.currentBalance;
        const finalAmount = targetType === 'decrease' ? Math.min(amount, prevBalance) : amount;
        const newBalance = targetType === 'increase' ? prevBalance + finalAmount : prevBalance - finalAmount;

        const adjustmentTx: BalanceAdjustmentTransaction = {
          id: `bulk_adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          studentId: s.id,
          studentName: s.name,
          type: targetType,
          amount: finalAmount,
          previousBalance: prevBalance,
          newBalance,
          reason: reason || (targetType === 'increase' ? 'Bulk Reward' : 'Bulk Fee/Deduction'),
          category: targetType === 'increase' ? 'reward' : 'fine',
          creditScoreChange: 0,
          timestamp: new Date().toISOString(),
        };

        const bulkDisclaimer = buildBalanceDisclaimer(
          s.id,
          prevBalance,
          newBalance,
          adjustmentTx.reason,
          targetType === 'increase' ? 'reward' : 'fine'
        );

        return {
          ...s,
          currentBalance: newBalance,
          balanceAdjustmentsHistory: [adjustmentTx, ...(s.balanceAdjustmentsHistory || [])],
          disclaimers: [bulkDisclaimer, ...(s.disclaimers || [])],
        };
      })
    );

    const actionWord = type === 'increase' ? 'Awarded' : 'Deducted';
    const sign = type === 'increase' ? '+' : '-';
    addToast(
      'success',
      'Bulk Operation Complete',
      `${actionWord} ${sign}E$${amount}.00 for ${studentIds.length} student${studentIds.length > 1 ? 's' : ''} (${reason}).`
    );
  };

  // Classroom Management Handlers
  const handleCreateClassroom = (classroomData: Omit<Classroom, 'id' | 'createdAt'>) => {
    const newClass: Classroom = {
      ...classroomData,
      id: `class-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClassrooms((prev) => [...prev, newClass]);
    addToast('success', 'Class Created', `Classroom "${newClass.name}" created successfully.`);
  };

  const handleUpdateClassroom = (updatedClass: Classroom) => {
    setClassrooms((prev) =>
      prev.map((c) => (c.id === updatedClass.id ? updatedClass : c))
    );
    if (updatedClass.name) {
      setStudents((prev) =>
        prev.map((s) => (s.classId === updatedClass.id ? { ...s, className: updatedClass.name } : s))
      );
    }
    addToast('success', 'Class Updated', `Classroom "${updatedClass.name}" updated.`);
  };

  const handleDeleteClassroom = (classId: string) => {
    const target = classrooms.find((c) => c.id === classId);
    setClassrooms((prev) => prev.filter((c) => c.id !== classId));
    setStudents((prev) =>
      prev.map((s) =>
        s.classId === classId ? { ...s, classId: undefined, className: undefined } : s
      )
    );
    addToast('info', 'Class Removed', `Classroom "${target?.name || classId}" removed. Students unassigned.`);
  };

  const handleReassignStudents = (fromClassId: string, toClassId: string) => {
    const targetClass = classrooms.find((c) => c.id === toClassId);
    setStudents((prev) =>
      prev.map((s) =>
        s.classId === fromClassId
          ? {
              ...s,
              classId: toClassId === 'none' ? undefined : toClassId,
              className: toClassId === 'none' ? undefined : targetClass?.name,
            }
          : s
      )
    );
    addToast('success', 'Students Reassigned', 'Students reassigned to new class.');
  };

  // Add a new student
  const handleAddStudent = (newStudentData: Omit<Student, 'id'>) => {
    const newId = `std-${Date.now()}`;
    const student: Student = {
      ...newStudentData,
      id: newId,
    };
    setStudents((prev) => [student, ...prev]);
    addToast(
      'success',
      'Student Enrolled',
      `${student.name} was enrolled with a $${settings.startingBalance} card limit.`
    );
  };

  // Add students in bulk
  const handleAddBulkStudents = (newStudentsBatch: Omit<Student, 'id'>[]) => {
    const createdStudents: Student[] = newStudentsBatch.map((s, idx) => ({
      ...s,
      id: `std-${Date.now()}-${idx}`,
    }));
    setStudents((prev) => [...createdStudents, ...prev]);
    addToast(
      'success',
      'Batch Enrollment Complete',
      `Successfully minted cards and enrolled ${createdStudents.length} students.`
    );
  };

  // Issue new loan (Opens immediately; Principal disburses once English work is verified)
  const handleIssueLoan = (
    studentId: string,
    data: { principal: number; durationDays: number; loanType: 'short' | 'big'; notes: string }
  ) => {
    const student = students.find((s) => s.id === studentId);
    if (!student || student.cardStatus === 'delisted') {
      addToast('warning', 'Loan Blocked', 'Delisted students cannot borrow.');
      return;
    }

    if (student.activeLoanId) {
      addToast('warning', 'Loan Blocked', 'Students can only have one active loan at a time.');
      return;
    }

    const effectiveRate = settings.baseInterestRate;
    const totalDue = calculateTotalDue(data.principal, effectiveRate);

    const now = new Date();
    const dueDate = new Date(now.getTime() + data.durationDays * 24 * 60 * 60 * 1000);

    const loanId = `loan-${Date.now().toString().slice(-4)}`;
    const newLoan: Loan = {
      id: loanId,
      studentId,
      principal: data.principal,
      baseInterestRate: settings.baseInterestRate,
      delayPenaltyRate: settings.delayPenaltyIncrement,
      delaysCount: 0,
      effectiveInterestRate: effectiveRate,
      totalDue,
      amountRepaid: 0,
      loanType: data.loanType,
      durationDays: data.durationDays,
      createdAt: now.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'active',
      submissions: [],
      notes: data.notes,
      principalDisbursed: false,
    };

    const loanDisclaimer = buildBalanceDisclaimer(
      student.id,
      student.currentBalance,
      student.currentBalance,
      `Loan Opened (E$${data.principal}.00): Complete your English notebook work (E$${totalDue}.00 total) and get Teacher approval to receive E$${data.principal}.00 in your wallet!`,
      'loan'
    );

    setLoans((prev) => [newLoan, ...prev]);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              activeLoanId: loanId,
              disclaimers: [loanDisclaimer, ...(s.disclaimers || [])],
            }
          : s
      )
    );

    addToast(
      'success',
      'Loan Opened — Disburses on Work Approval!',
      `Opened E$${data.principal}.00 loan for ${student.name}. Once their English work (E$${totalDue}.00) is verified (via photo or face-to-face), E$${data.principal}.00 will be deposited into their wallet!`
    );
  };

  // Apply Delay Penalty (+2% higher interest per delay & credit score penalty)
  const handleApplyDelayPenalty = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    const newDelays = loan.delaysCount + 1;
    const newRate = calculateEffectiveInterest(newDelays, settings);
    const newTotal = calculateTotalDue(loan.principal, newRate);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              delaysCount: newDelays,
              effectiveInterestRate: newRate,
              totalDue: newTotal,
            }
          : l
      )
    );

    // Apply delay penalty to student score
    setStudents((prev) =>
      prev.map((s) =>
        s.id === loan.studentId
          ? {
              ...s,
              delaysCount: s.delaysCount + 1,
              creditScore: Math.max(300, s.creditScore - settings.lateDelayScorePenalty),
            }
          : s
      )
    );

    addToast(
      'warning',
      'Delay Penalty Logged',
      `+${settings.delayPenaltyIncrement}% late interest added (now ${newRate}%). Score docked -${settings.lateDelayScorePenalty} pts.`
    );
  };

  // Submit English Work for repayment (or direct teacher face-to-face verification)
  const handleSubmitEnglishWork = (submissionData: Omit<EnglishSubmission, 'id' | 'createdAt'>) => {
    const subId = `sub-${Date.now()}`;
    const newSubmission: EnglishSubmission = {
      ...submissionData,
      id: subId,
      createdAt: new Date().toISOString(),
    };

    if (submissionData.status === 'approved') {
      const loan = loans.find((l) => l.id === submissionData.loanId);
      if (!loan) return;

      const remainingBeforePayment = Math.max(0, loan.totalDue - loan.amountRepaid);
      const paymentCredit = submissionData.totalCreditValue;
      const extraMoney = Math.max(0, paymentCredit - remainingBeforePayment);
      const newRepaid = loan.amountRepaid + paymentCredit;
      const isFullyPaid = newRepaid >= loan.totalDue;
      const shouldDisbursePrincipal = isFullyPaid && loan.principalDisbursed === false;
      const principalToDisburse = shouldDisbursePrincipal ? loan.principal : 0;
      const totalWalletDeposit = principalToDisburse + extraMoney;

      // Update Loan
      setLoans((prev) =>
        prev.map((l) => {
          if (l.id !== submissionData.loanId) return l;
          return {
            ...l,
            amountRepaid: Math.min(newRepaid, l.totalDue),
            status: isFullyPaid ? 'paid' : 'active',
            paidAt: isFullyPaid ? new Date().toISOString() : undefined,
            principalDisbursed: isFullyPaid ? true : l.principalDisbursed,
            submissions: [newSubmission, ...l.submissions],
          };
        })
      );

      // Update Student credit score, limits, and deposit loan principal + extra money directly to account
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id !== loan.studentId) return student;

          let scoreDelta = 0;
          let decoratedCount = student.decoratedStatementsCount;
          let punctualCount = student.punctualPaymentsCount;

          if (submissionData.hasDecoratedPresentation) {
            scoreDelta += settings.decoratedPresentationScoreBoost;
            decoratedCount += 1;
          }

          if (isFullyPaid && loan.delaysCount === 0) {
            scoreDelta += settings.punctualityScoreBoost;
            punctualCount += 1;
          }

          const newScore = Math.min(850, Math.max(300, student.creditScore + scoreDelta));
          const tier = getCreditTier(newScore);
          const newMaxLimit = isFullyPaid
            ? Math.min(settings.maxLoanCap, Math.max(student.maxLoanLimit + 50, tier.maxLoanLimit))
            : student.maxLoanLimit;

          const prevBalance = student.currentBalance;
          const updatedBalance = prevBalance + totalWalletDeposit;
          const disclaimersList = [...(student.disclaimers || [])];
          const adjustmentsList = [...(student.balanceAdjustmentsHistory || [])];

          if (totalWalletDeposit > 0) {
            const depositReason =
              principalToDisburse > 0
                ? `Face-to-Face Loan Work Approved! Disbursed E$${principalToDisburse}.00 Loan Principal${
                    extraMoney > 0 ? ` + E$${extraMoney}.00 Extra English Bonus` : ''
                  }`
                : `Face-to-Face Loan Repayment Surplus (+E$${extraMoney}.00 extra work)`;

            disclaimersList.unshift(
              buildBalanceDisclaimer(
                student.id,
                prevBalance,
                updatedBalance,
                depositReason,
                'loan'
              )
            );
            adjustmentsList.unshift({
              id: `loan_disb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              studentId: student.id,
              studentName: student.name,
              type: 'increase',
              amount: totalWalletDeposit,
              previousBalance: prevBalance,
              newBalance: updatedBalance,
              reason: depositReason,
              category: 'reward',
              creditScoreChange: scoreDelta,
              timestamp: new Date().toISOString(),
            });
          }

          return {
            ...student,
            currentBalance: updatedBalance,
            creditScore: newScore,
            maxLoanLimit: newMaxLimit,
            activeLoanId: isFullyPaid ? null : student.activeLoanId,
            totalLoansCompleted: isFullyPaid ? student.totalLoansCompleted + 1 : student.totalLoansCompleted,
            punctualPaymentsCount: punctualCount,
            decoratedStatementsCount: decoratedCount,
            disclaimers: disclaimersList,
            balanceAdjustmentsHistory: adjustmentsList,
          };
        })
      );

      const targetStudent = students.find((s) => s.id === loan.studentId);
      addToast(
        'success',
        isFullyPaid ? 'Loan Verified & Money Disbursed!' : 'Face-to-Face Work Verified',
        totalWalletDeposit > 0
          ? `Loan settled! Deposited E$${totalWalletDeposit}.00 (${
              principalToDisburse > 0
                ? `E$${principalToDisburse} loan principal${extraMoney > 0 ? ` + E$${extraMoney} bonus` : ''}`
                : `E$${extraMoney} bonus`
            }) directly into ${targetStudent?.name || 'student'}'s wallet!`
          : `Credited E$${submissionData.totalCreditValue} toward loan.${isFullyPaid ? ' Loan is completely settled!' : ''}`
      );
      return;
    }

    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === submissionData.loanId
          ? {
              ...loan,
              status: 'pending_review',
              submissions: [newSubmission, ...loan.submissions],
            }
          : loan
      )
    );

    addToast(
      'info',
      'In-Class Presentation Logged',
      `Calculated credit value: $${submissionData.totalCreditValue}. Present notebook to teacher in class.`
    );
  };

  // Teacher verifies and approves English Submission
  const handleApproveEnglishSubmission = (submissionId: string, loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    const submission = loan.submissions.find((s) => s.id === submissionId);
    if (!submission) return;

    const remainingBeforePayment = Math.max(0, loan.totalDue - loan.amountRepaid);
    const paymentCredit = submission.totalCreditValue;
    const extraMoney = Math.max(0, paymentCredit - remainingBeforePayment);
    const newRepaid = loan.amountRepaid + paymentCredit;
    const isFullyPaid = newRepaid >= loan.totalDue;
    const shouldDisbursePrincipal = isFullyPaid && loan.principalDisbursed === false;
    const principalToDisburse = shouldDisbursePrincipal ? loan.principal : 0;
    const totalWalletDeposit = principalToDisburse + extraMoney;

    // Update Loan
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        return {
          ...l,
          amountRepaid: Math.min(newRepaid, l.totalDue),
          status: isFullyPaid ? 'paid' : 'active',
          paidAt: isFullyPaid ? new Date().toISOString() : undefined,
          principalDisbursed: isFullyPaid ? true : l.principalDisbursed,
          submissions: l.submissions.map((s) =>
            s.id === submissionId
              ? { ...s, status: 'approved', reviewedAt: new Date().toISOString() }
              : s
          ),
        };
      })
    );

    // Update Student credit score and limits
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== loan.studentId) return student;

        let scoreDelta = 0;
        let decoratedCount = student.decoratedStatementsCount;
        let punctualCount = student.punctualPaymentsCount;

        // Presentation Decoration bonus
        if (submission.hasDecoratedPresentation) {
          scoreDelta += settings.decoratedPresentationScoreBoost;
          decoratedCount += 1;
        }

        // On-time full repayment punctuality boost
        if (isFullyPaid && loan.delaysCount === 0) {
          scoreDelta += settings.punctualityScoreBoost;
          punctualCount += 1;
        }

        const newScore = Math.min(850, Math.max(300, student.creditScore + scoreDelta));
        const tier = getCreditTier(newScore);

        // Gradually increase max loan limit up to $1,000 based on tier / history
        const newMaxLimit = isFullyPaid
          ? Math.min(settings.maxLoanCap, Math.max(student.maxLoanLimit + 50, tier.maxLoanLimit))
          : student.maxLoanLimit;

        const prevBalance = student.currentBalance;
        const updatedBalance = prevBalance + totalWalletDeposit;
        const disclaimersList = [...(student.disclaimers || [])];

        if (totalWalletDeposit > 0) {
          disclaimersList.unshift(
            buildBalanceDisclaimer(
              student.id,
              prevBalance,
              updatedBalance,
              principalToDisburse > 0
                ? `Loan Work Approved! Disbursed E$${principalToDisburse}.00 Loan Principal${
                    extraMoney > 0 ? ` + E$${extraMoney}.00 Extra Work Bonus` : ''
                  }`
                : `Loan Repayment Surplus (+E$${extraMoney}.00 extra work)`,
              'loan'
            )
          );
        }

        return {
          ...student,
          currentBalance: updatedBalance,
          creditScore: newScore,
          maxLoanLimit: newMaxLimit,
          activeLoanId: isFullyPaid ? null : student.activeLoanId,
          totalLoansCompleted: isFullyPaid
            ? student.totalLoansCompleted + 1
            : student.totalLoansCompleted,
          punctualPaymentsCount: punctualCount,
          decoratedStatementsCount: decoratedCount,
          disclaimers: disclaimersList,
        };
      })
    );

    const targetStudent = students.find((s) => s.id === loan.studentId);
    addToast(
      'success',
      'English Submission Approved!',
      isFullyPaid
        ? totalWalletDeposit > 0
          ? `Loan settled! Deposited E$${totalWalletDeposit}.00 into ${targetStudent?.name || 'student'}'s account balance.`
          : `Loan fully settled! Credit score & loan limits increased.`
        : `E$${submission.totalCreditValue} credited toward loan balance.`
    );
  };

  // Reject submission
  const handleRejectEnglishSubmission = (submissionId: string, loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        return {
          ...l,
          submissions: l.submissions.map((s) =>
            s.id === submissionId ? { ...s, status: 'rejected' } : s
          ),
        };
      })
    );
    addToast('warning', 'Corrections Requested', 'Student notified to revise English work.');
  };

  // Manually add daily English reward money to student (with optional FICO credit score delta)
  const handleAddDailyEnglishReward = (
    studentId: string,
    amount: number,
    reason: string,
    creditScoreDelta: number = 0
  ): { success: boolean; error?: string } => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, error: 'Student not found.' };
    }

    if (student.cardStatus === 'delisted') {
      addToast('warning', 'Card Delisted', `${student.name}'s card is delisted. Reactivate card first to add funds.`);
      return { success: false, error: 'Student card is delisted.' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be greater than $0.' };
    }

    const todayStr = getTodayDateString();
    const currentEarned =
      student.dailyEnglishEarned?.date === todayStr ? student.dailyEnglishEarned.amount : 0;

    const newDailyTotal = currentEarned + amount;
    const newBalance = student.currentBalance + amount;
    const newScore =
      creditScoreDelta !== 0
        ? Math.min(850, Math.max(300, student.creditScore + creditScoreDelta))
        : student.creditScore;

    const rewardTransaction: EnglishRewardTransaction = {
      id: `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      amount,
      reason: reason.trim() || 'English classroom participation',
      createdAt: new Date().toISOString(),
    };

    const rewardDisclaimer = buildBalanceDisclaimer(
      student.id,
      student.currentBalance,
      newBalance,
      `English Daily Eurodollar Grant: ${rewardTransaction.reason}`,
      'reward'
    );

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          currentBalance: newBalance,
          creditScore: newScore,
          dailyEnglishEarned: {
            date: todayStr,
            amount: newDailyTotal,
          },
          englishRewardsHistory: [rewardTransaction, ...(s.englishRewardsHistory || [])],
          disclaimers: [rewardDisclaimer, ...(s.disclaimers || [])],
        };
      })
    );

    const scoreMsg =
      creditScoreDelta !== 0
        ? ` • FICO ${creditScoreDelta > 0 ? `+${creditScoreDelta}` : creditScoreDelta} PTS`
        : '';

    addToast(
      'success',
      'English Reward Added!',
      `+E$${amount}.00 awarded to ${student.name} (${rewardTransaction.reason})${scoreMsg}. Today's total: E$${newDailyTotal}.00.`
    );

    return { success: true };
  };

  // Reset to initial sample data
  const handleResetData = () => {
    if (window.confirm('Reset all classroom data, loans, and credit scores to original sample values?')) {
      setStudents(INITIAL_STUDENTS);
      setLoans(INITIAL_LOANS);
      setContracts(INITIAL_CONTRACTS);
      setSettings(DEFAULT_TEACHER_SETTINGS);
      localStorage.clear();
      addToast('info', 'System Reset', 'Classroom data reset to default sample roster.');
    }
  };

  // Restore complete state from user backup JSON
  const handleRestoreBackup = (data: {
    students: Student[];
    loans: Loan[];
    storeItems?: StoreItem[];
    classrooms?: Classroom[];
    pendingRequests?: PendingStudentRequest[];
    settings?: TeacherSettings;
  }) => {
    if (data.students && Array.isArray(data.students)) {
      setStudents(data.students);
    }
    if (data.loans && Array.isArray(data.loans)) {
      setLoans(data.loans);
    }
    if (data.storeItems && Array.isArray(data.storeItems)) {
      setStoreCatalog(data.storeItems);
    }
    if (data.classrooms && Array.isArray(data.classrooms)) {
      setClassrooms(data.classrooms);
    }
    if (data.pendingRequests && Array.isArray(data.pendingRequests)) {
      setPendingRequests(data.pendingRequests);
    }
    if (data.settings) {
      setSettings(data.settings);
    }
    addToast('success', 'Backup Restored', 'Classroom state and student progress successfully restored!');
  };

  // Save manual snapshot to local browser cache
  const handleSaveManualSnapshot = () => {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      students,
      loans,
      storeCatalog,
      classrooms,
      pendingRequests,
      contracts,
      settings,
    };
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('esl_snapshot_')) {
          localStorage.removeItem(k);
        }
      });
      localStorage.setItem('esl_classroom_emergency_snapshot', JSON.stringify(payload));
      addToast('success', 'Snapshot Saved', `Emergency recovery snapshot saved at ${new Date().toLocaleTimeString()}.`);
    } catch {
      addToast('warning', 'Snapshot Notice', 'Local storage limit reached. Please use Download JSON backup.');
    }
  };

  // Teacher 1-click Reset Student Password back to their 3-digit Card CVV
  const handleResetStudentPassword = (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, customPassword: undefined } : s))
    );
    addToast(
      'info',
      'Student Password Reset to Card CVV',
      `${target.name}'s login password has been reset to their 3-digit Card CVV (${target.cvv}).`
    );
  };

  // Teacher Manager Change Student Password to any custom password (or reset to CVV)
  const handleChangeStudentPassword = (studentId: string, newPassword: string | undefined) => {
    const target = students.find((s) => s.id === studentId);
    if (!target) return;
    const cleaned = newPassword?.trim() || undefined;
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, customPassword: cleaned } : s))
    );
    if (cleaned) {
      addToast(
        'success',
        'Student Password Updated!',
        `${target.name}'s login password has been changed to "${cleaned}".`
      );
    } else {
      addToast(
        'info',
        'Student Password Reset to Card CVV',
        `${target.name}'s login password has been reset to their 3-digit Card CVV (${target.cvv}).`
      );
    }
  };

  // Contracts / Events Wall Management Handlers
  const handleCreateContract = (newContractData: {
    title: string;
    instructions: string;
    rewardAmount: number;
    creditScoreBonus: number;
    totalStock: number;
    classroomId: string;
    deadline?: string;
  }) => {
    const newContract: ClassroomContract = {
      id: `contract_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newContractData.title,
      instructions: newContractData.instructions,
      rewardAmount: newContractData.rewardAmount,
      creditScoreBonus: newContractData.creditScoreBonus,
      totalStock: newContractData.totalStock,
      spotsRemaining: newContractData.totalStock,
      classroomId: newContractData.classroomId,
      deadline: newContractData.deadline,
      isActive: true,
      createdAt: new Date().toISOString(),
      claims: [],
    };
    setContracts((prev) => [newContract, ...prev]);
    addToast(
      'success',
      'Contract Posted to Wall! 📜',
      `"${newContract.title}" is now live with ${newContract.totalStock} available spot(s) at +E$${newContract.rewardAmount}.00 each.`
    );
  };

  const handleDeleteContract = (contractId: string) => {
    const target = contracts.find((c) => c.id === contractId);
    if (target) {
      target.claims.forEach((cl) => {
        removeCloudStudentAction(
          `act_res_${cl.id}`,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      });
    }
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
    setPendingRequests((prev) => {
      const toRemove = prev.filter(
        (r) =>
          r.type === 'contract_submission' &&
          r.contractSubmissionData?.contractId === contractId
      );
      toRemove.forEach((r) => {
        removeCloudStudentAction(
          `act_${r.id}`,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      });
      return prev.filter((r) => !toRemove.some((rem) => rem.id === r.id));
    });
    addToast('info', 'Contract Removed', `Removed "${target?.title || 'Contract'}" from the Contracts Wall.`);
  };

  const handleToggleContractActive = (contractId: string) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const handleReleaseContractSpot = (contractId: string, claimId: string, studentId?: string) => {
    removeCloudStudentAction(
      `act_res_${claimId}`,
      settings.cloudDatabaseUrl,
      settings.cloudSupabaseKey
    );
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const existingClaim = c.claims.find(
          (cl) =>
            (claimId ? cl.id === claimId : Boolean(studentId && cl.studentId === studentId)) &&
            cl.status !== 'approved'
        );
        if (!existingClaim) return c;
        const nextClaims = c.claims.filter((cl) => cl.id !== existingClaim.id);
        return {
          ...c,
          spotsRemaining: Math.min(c.totalStock, Math.max(0, c.totalStock - nextClaims.length)),
          claims: nextClaims,
        };
      })
    );
    setPendingRequests((prev) => {
      const toRemove = prev.filter(
        (r) =>
          r.type === 'contract_submission' &&
          r.status === 'pending' &&
          (r.contractSubmissionData?.claimId === claimId ||
            (studentId &&
              r.studentId === studentId &&
              r.contractSubmissionData?.contractId === contractId))
      );
      toRemove.forEach((r) => {
        removeCloudStudentAction(
          `act_${r.id}`,
          settings.cloudDatabaseUrl,
          settings.cloudSupabaseKey
        );
      });
      return prev.filter((r) => !toRemove.some((rem) => rem.id === r.id));
    });
    addToast('info', 'Contract Spot Released', 'Spot returned to the Contracts Wall for other students.');
  };

  const handleApproveContractClaim = (
    contractId: string,
    claimId: string,
    teacherFeedback?: string
  ) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;
    const claim = contract.claims.find((cl) => cl.id === claimId);
    if (!claim || claim.status === 'approved') return;

    const nowIso = new Date().toISOString();
    const reward = contract.rewardAmount;
    const scoreBonus = contract.creditScoreBonus || 0;

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        return {
          ...c,
          claims: c.claims.map((cl) =>
            cl.id === claimId
              ? {
                  ...cl,
                  status: 'approved',
                  reviewedAt: nowIso,
                  teacherFeedback: teacherFeedback || 'Approved by Teacher',
                }
              : cl
          ),
        };
      })
    );

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== claim.studentId) return student;
        const prevBalance = student.currentBalance;
        const newBalance = prevBalance + reward;
        const newScore = Math.min(850, Math.max(300, student.creditScore + scoreBonus));
        const reasonText = `Contract Completed: "${contract.title}"${
          teacherFeedback ? ` (${teacherFeedback})` : ''
        }`;

        const adjustmentTx: BalanceAdjustmentTransaction = {
          id: `contract_rew_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          studentId: student.id,
          studentName: student.name,
          type: 'increase',
          amount: reward,
          previousBalance: prevBalance,
          newBalance,
          reason: reasonText,
          category: 'reward',
          creditScoreChange: scoreBonus,
          timestamp: nowIso,
        };

        const disclaimer = buildBalanceDisclaimer(
          student.id,
          prevBalance,
          newBalance,
          reasonText,
          'reward'
        );

        return {
          ...student,
          currentBalance: newBalance,
          creditScore: newScore,
          balanceAdjustmentsHistory: [adjustmentTx, ...(student.balanceAdjustmentsHistory || [])],
          disclaimers: [disclaimer, ...(student.disclaimers || [])],
        };
      })
    );

    // Also mark any matching pending request as approved
    setPendingRequests((prev) =>
      prev.map((r) => {
        if (
          r.type === 'contract_submission' &&
          r.status === 'pending' &&
          r.contractSubmissionData?.claimId === claimId
        ) {
          removeCloudStudentAction(
            `act_${r.id}`,
            settings.cloudDatabaseUrl,
            settings.cloudSupabaseKey
          );
          return {
            ...r,
            status: 'approved',
            reviewedAt: nowIso,
            teacherNote: teacherFeedback || 'Contract verified & rewarded!',
            contractSubmissionData: r.contractSubmissionData
              ? { ...r.contractSubmissionData, notebookPhotoDataUrl: '' }
              : undefined,
          };
        }
        return r;
      })
    );

    addToast(
      'success',
      'Contract Approved & E$ Paid! 🏆',
      `Awarded +E$${reward}.00${scoreBonus > 0 ? ` and +${scoreBonus} FICO PTS` : ''} to ${claim.studentName} for "${contract.title}".`
    );
  };

  const handleRejectContractClaim = (
    contractId: string,
    claimId: string,
    teacherFeedback?: string,
    releaseSpot: boolean = false
  ) => {
    const contract = contracts.find((c) => c.id === contractId);
    const claim = contract?.claims.find((cl) => cl.id === claimId);
    const nowIso = new Date().toISOString();

    if (releaseSpot) {
      removeCloudStudentAction(
        `act_res_${claimId}`,
        settings.cloudDatabaseUrl,
        settings.cloudSupabaseKey
      );
    }

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        if (releaseSpot) {
          const nextClaims = c.claims.filter((cl) => cl.id !== claimId);
          return {
            ...c,
            spotsRemaining: Math.min(c.totalStock, Math.max(0, c.totalStock - nextClaims.length)),
            claims: nextClaims,
          };
        }
        return {
          ...c,
          claims: c.claims.map((cl) =>
            cl.id === claimId
              ? {
                  ...cl,
                  status: 'rejected',
                  reviewedAt: nowIso,
                  teacherFeedback:
                    teacherFeedback ||
                    'Please revise your notebook work and upload a new photo',
                }
              : cl
          ),
        };
      })
    );

    setPendingRequests((prev) =>
      prev.map((r) => {
        if (
          r.type === 'contract_submission' &&
          r.status === 'pending' &&
          r.contractSubmissionData?.claimId === claimId
        ) {
          removeCloudStudentAction(
            `act_${r.id}`,
            settings.cloudDatabaseUrl,
            settings.cloudSupabaseKey
          );
          return {
            ...r,
            status: 'rejected',
            reviewedAt: nowIso,
            teacherNote: teacherFeedback || 'Please revise your contract notebook work',
            contractSubmissionData: r.contractSubmissionData
              ? { ...r.contractSubmissionData, notebookPhotoDataUrl: '' }
              : undefined,
          };
        }
        return r;
      })
    );

    addToast(
      'warning',
      releaseSpot ? 'Contract Declined & Spot Released' : 'Contract Revision Requested',
      releaseSpot
        ? `Declined ${claim?.studentName || 'student'}'s submission and freed the spot.`
        : `Asked ${claim?.studentName || 'student'} to upload a revised notebook photo.`
    );
  };

  const handleManualCompleteContractFaceToFace = (contractId: string, studentId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    const student = students.find((s) => s.id === studentId);
    if (!contract || !student) return;

    const existingClaim = contract.claims.find(
      (cl) =>
        cl.studentId === student.id &&
        (cl.status === 'reserved' || cl.status === 'pending_approval' || cl.status === 'rejected')
    );

    if (existingClaim) {
      handleApproveContractClaim(
        contractId,
        existingClaim.id,
        'Verified face-to-face in class by Teacher'
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const claimId = `claim_f2f_${Date.now()}`;
    const reward = contract.rewardAmount;
    const scoreBonus = contract.creditScoreBonus || 0;

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        return {
          ...c,
          spotsRemaining: Math.max(0, c.spotsRemaining - 1),
          claims: [
            ...c.claims,
            {
              id: claimId,
              contractId: c.id,
              studentId: student.id,
              studentName: student.name,
              classId: student.classId,
              className: student.className,
              status: 'approved',
              reservedAt: nowIso,
              submittedAt: nowIso,
              reviewedAt: nowIso,
              teacherFeedback: 'Verified face-to-face in class by Teacher',
            },
          ],
        };
      })
    );

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== student.id) return s;
        const prevBalance = s.currentBalance;
        const newBalance = prevBalance + reward;
        const newScore = Math.min(850, Math.max(300, s.creditScore + scoreBonus));
        const reasonText = `Contract Completed (Face-to-Face): "${contract.title}"`;

        const adjustmentTx: BalanceAdjustmentTransaction = {
          id: `contract_f2f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          studentId: s.id,
          studentName: s.name,
          type: 'increase',
          amount: reward,
          previousBalance: prevBalance,
          newBalance,
          reason: reasonText,
          category: 'reward',
          creditScoreChange: scoreBonus,
          timestamp: nowIso,
        };

        const disclaimer = buildBalanceDisclaimer(
          s.id,
          prevBalance,
          newBalance,
          reasonText,
          'reward'
        );

        return {
          ...s,
          currentBalance: newBalance,
          creditScore: newScore,
          balanceAdjustmentsHistory: [adjustmentTx, ...(s.balanceAdjustmentsHistory || [])],
          disclaimers: [disclaimer, ...(s.disclaimers || [])],
        };
      })
    );

    addToast(
      'success',
      'Face-to-Face Contract Rewarded! 🏆',
      `Awarded +E$${reward}.00${scoreBonus > 0 ? ` and +${scoreBonus} FICO PTS` : ''} to ${student.name} for "${contract.title}".`
    );
  };

  // Approve a pending student request from the Student Web App
  const handleApprovePendingRequest = (requestId: string, teacherNote?: string) => {
    const req = pendingRequests.find((r) => r.id === requestId && r.status === 'pending');
    if (!req) return;

    const nowIso = new Date().toISOString();

    if (req.type === 'contract_submission' && req.contractSubmissionData) {
      const subData = req.contractSubmissionData;
      handleApproveContractClaim(
        subData.contractId,
        subData.claimId,
        teacherNote || 'Contract notebook photo approved!'
      );
      return;
    }

    if (req.type === 'loan_request' && req.loanRequestData) {
      const student = students.find((s) => s.id === req.studentId);
      if (student && student.cardStatus !== 'delisted') {
        const data = req.loanRequestData;
        const effectiveRate = settings.baseInterestRate;
        const totalDue = calculateTotalDue(data.principal, effectiveRate);
        const dueDate = new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000);
        const loanId = `loan-${Date.now().toString().slice(-4)}`;

        const newLoan: Loan = {
          id: loanId,
          studentId: student.id,
          principal: data.principal,
          baseInterestRate: settings.baseInterestRate,
          delayPenaltyRate: settings.delayPenaltyIncrement,
          delaysCount: 0,
          effectiveInterestRate: effectiveRate,
          totalDue,
          amountRepaid: 0,
          loanType: data.loanType,
          durationDays: data.durationDays,
          createdAt: nowIso,
          dueDate: dueDate.toISOString(),
          status: 'active',
          submissions: [],
          notes: data.notes,
          principalDisbursed: false,
        };

        const disclaimer = buildBalanceDisclaimer(
          student.id,
          student.currentBalance,
          student.currentBalance,
          `Loan Opened (E$${data.principal}.00): Complete your English notebook work (E$${totalDue}.00) and send your photo to receive E$${data.principal}.00 in your wallet!`,
          'loan'
        );

        setLoans((prev) => [newLoan, ...prev]);
        setStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  activeLoanId: loanId,
                  disclaimers: [disclaimer, ...(s.disclaimers || [])],
                }
              : s
          )
        );
        addToast(
          'success',
          'Loan Request Opened!',
          `Opened E$${data.principal}.00 loan for ${student.name}. Money will disburse once they submit their notebook photo.`
        );
      }
    } else if (req.type === 'loan_payment' && req.loanPaymentData) {
      const payData = req.loanPaymentData;
      const loan = loans.find((l) => l.id === payData.loanId);
      if (loan) {
        const remainingBefore = Math.max(0, loan.totalDue - loan.amountRepaid);
        const paymentCredit = payData.totalCreditValue;
        const extraMoney = Math.max(0, paymentCredit - remainingBefore);
        const newRepaid = loan.amountRepaid + paymentCredit;
        const isFullyPaid = newRepaid >= loan.totalDue;
        const shouldDisbursePrincipal = isFullyPaid && loan.principalDisbursed === false;
        const principalToDisburse = shouldDisbursePrincipal ? loan.principal : 0;
        const totalWalletDeposit = principalToDisburse + extraMoney;

        const newSub: EnglishSubmission = {
          id: `sub_${Date.now()}`,
          loanId: loan.id,
          studentId: req.studentId,
          createdAt: req.createdAt,
          sentencesCount: payData.sentencesCount,
          wordsCount: payData.wordsCount,
          phrasalVerbsCount: payData.phrasalVerbsCount,
          sentences: [],
          words: [],
          phrasalVerbs: [],
          sentencesCredit: payData.sentencesCount * settings.sentenceValue,
          wordsCredit: payData.wordsCount * settings.wordValue,
          phrasalVerbsCredit: payData.phrasalVerbsCount * settings.phrasalVerbValue,
          totalCreditValue: paymentCredit,
          hasDecoratedPresentation: payData.hasDecoratedPresentation,
          scoreBonusAwarded: payData.hasDecoratedPresentation
            ? settings.decoratedPresentationScoreBoost
            : 0,
          status: 'approved',
          teacherFeedback: teacherNote,
          reviewedAt: nowIso,
          notebookPhotoDataUrl: payData.notebookPhotoDataUrl,
          studentNotes: payData.studentNotes,
        };

        setLoans((prev) =>
          prev.map((l) =>
            l.id === loan.id
              ? {
                  ...l,
                  amountRepaid: Math.min(newRepaid, l.totalDue),
                  status: isFullyPaid ? 'paid' : 'active',
                  paidAt: isFullyPaid ? nowIso : undefined,
                  principalDisbursed: isFullyPaid ? true : l.principalDisbursed,
                  submissions: [newSub, ...l.submissions],
                }
              : l
          )
        );

        setStudents((prev) =>
          prev.map((student) => {
            if (student.id !== loan.studentId) return student;

            let scoreDelta = 0;
            let decoratedCount = student.decoratedStatementsCount;
            let punctualCount = student.punctualPaymentsCount;

            if (payData.hasDecoratedPresentation) {
              scoreDelta += settings.decoratedPresentationScoreBoost;
              decoratedCount += 1;
            }
            if (isFullyPaid && loan.delaysCount === 0) {
              scoreDelta += settings.punctualityScoreBoost;
              punctualCount += 1;
            }

            const newScore = Math.min(850, Math.max(300, student.creditScore + scoreDelta));
            const tier = getCreditTier(newScore);
            const newMaxLimit = isFullyPaid
              ? Math.min(settings.maxLoanCap, Math.max(student.maxLoanLimit + 50, tier.maxLoanLimit))
              : student.maxLoanLimit;

            const prevBalance = student.currentBalance;
            const updatedBalance = prevBalance + totalWalletDeposit;
            const disclaimersList = [...(student.disclaimers || [])];
            const adjustmentsList = [...(student.balanceAdjustmentsHistory || [])];

            if (totalWalletDeposit > 0) {
              const depositReason =
                principalToDisburse > 0
                  ? `Notebook Photo Approved! Disbursed E$${principalToDisburse}.00 Loan Principal${
                      extraMoney > 0 ? ` + E$${extraMoney}.00 Extra English Bonus` : ''
                    } into your wallet!`
                  : `Notebook Loan Repayment Surplus (+E$${extraMoney}.00 after settling loan)`;

              disclaimersList.unshift(
                buildBalanceDisclaimer(
                  student.id,
                  prevBalance,
                  updatedBalance,
                  depositReason,
                  'loan'
                )
              );
              adjustmentsList.unshift({
                id: `loan_disb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                studentId: student.id,
                studentName: student.name,
                type: 'increase',
                amount: totalWalletDeposit,
                previousBalance: prevBalance,
                newBalance: updatedBalance,
                reason: depositReason,
                category: 'reward',
                creditScoreChange: scoreDelta,
                timestamp: nowIso,
              });
            }

            return {
              ...student,
              currentBalance: updatedBalance,
              creditScore: newScore,
              maxLoanLimit: newMaxLimit,
              activeLoanId: isFullyPaid ? null : student.activeLoanId,
              totalLoansCompleted: isFullyPaid
                ? student.totalLoansCompleted + 1
                : student.totalLoansCompleted,
              punctualPaymentsCount: punctualCount,
              decoratedStatementsCount: decoratedCount,
              disclaimers: disclaimersList,
              balanceAdjustmentsHistory: adjustmentsList,
            };
          })
        );

        addToast(
          'success',
          isFullyPaid ? 'Notebook Photo Approved & Loan Money Disbursed!' : 'Notebook Photo Approved!',
          totalWalletDeposit > 0
            ? `Credited E$${paymentCredit}.00 work and deposited E$${totalWalletDeposit}.00 (${
                principalToDisburse > 0
                  ? `E$${principalToDisburse} loan principal${extraMoney > 0 ? ` + E$${extraMoney} bonus` : ''}`
                  : `E$${extraMoney} bonus`
              }) directly into ${req.studentName}'s wallet!`
            : `Credited E$${paymentCredit}.00 toward ${req.studentName}'s loan.${
                isFullyPaid ? ' Loan is now 100% PAID!' : ''
              }`
        );
      }
    } else if (req.type === 'store_purchase' && req.storePurchaseData) {
      const storeData = req.storePurchaseData;
      const student = students.find((s) => s.id === req.studentId);
      if (student) {
        const totalCost = storeData.totalPrice;
        const prevBalance = student.currentBalance;
        const newBalance = Math.max(0, prevBalance - totalCost);
        const totalItemsQty = storeData.items.reduce((a, b) => a + b.quantity, 0);
        const scoreBonus = Math.min(25, 5 * storeData.items.length);
        const newScore = Math.min(850, student.creditScore + scoreBonus);

        // Decrement catalog stock
        setStoreCatalog((prevCat) =>
          prevCat.map((item) => {
            const ordered = storeData.items.find((i) => i.itemId === item.id);
            if (!ordered || item.unlimitedStock) return item;
            return { ...item, stock: Math.max(0, item.stock - ordered.quantity) };
          })
        );

        const purchaseRecords: StorePurchaseTransaction[] = storeData.items.map((it) => {
          const allocSummary = formatStoreAllocationsSummary(it.allocations);
          return {
            id: `purch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            studentId: student.id,
            studentName: student.name,
            itemId: it.itemId,
            itemName: `${it.itemName}${it.quantity > 1 ? ` (x${it.quantity})` : ''}${
              allocSummary ? ` [${allocSummary}]` : ''
            }`,
            pricePaid: it.unitPrice * it.quantity,
            originalPrice: it.originalPrice * it.quantity,
            discountPercent: it.discountPercent,
            quantity: it.quantity,
            creditScoreBonusAwarded: 5,
            allocations: it.allocations,
            timestamp: nowIso,
          };
        });

        const autoConfirmMsg = "Your request will be done asap - Teacher Anthony's ATM";
        const combinedNote = teacherNote
          ? `${autoConfirmMsg} (${teacherNote})`
          : autoConfirmMsg;

        const disclaimer = buildBalanceDisclaimer(
          student.id,
          prevBalance,
          newBalance,
          `Approved Store Order (${purchaseRecords.map((p) => p.itemName).join('; ')}): "${combinedNote}"`,
          'store'
        );

        setStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  currentBalance: newBalance,
                  reservedBalance: Math.max(0, (s.reservedBalance || 0) - req.reservedAmount),
                  creditScore: newScore,
                  totalStorePurchasesCount: (s.totalStorePurchasesCount || 0) + totalItemsQty,
                  storePurchasesHistory: [
                    ...purchaseRecords,
                    ...(s.storePurchasesHistory || []),
                  ],
                  disclaimers: [disclaimer, ...(s.disclaimers || [])],
                }
              : s
          )
        );

        addToast(
          'success',
          'Store Order Approved!',
          `Approved ${req.studentName}'s store purchase of E$${totalCost}.00 and sent confirmation: "${autoConfirmMsg}".`
        );
      }
    } else if (req.type === 'p2p_transfer' && req.transferData) {
      const tf = req.transferData;
      const sender = students.find((s) => s.id === req.studentId);
      const recipient = students.find((s) => s.id === tf.recipientId);

      if (sender && recipient) {
        const senderPrev = sender.currentBalance;
        const senderNew = Math.max(0, senderPrev - tf.amount);
        const recipientPrev = recipient.currentBalance;
        const recipientNew = recipientPrev + tf.amount;

        const sentRecord: P2PTransferRecord = {
          id: `p2p_s_${Date.now()}`,
          direction: 'sent',
          counterpartyId: recipient.id,
          counterpartyName: recipient.name,
          counterpartyClassName: recipient.className,
          amount: tf.amount,
          message: tf.message || 'To you - from me',
          isPostalCard: true,
          timestamp: nowIso,
        };

        const receivedRecord: P2PTransferRecord = {
          id: `p2p_r_${Date.now()}`,
          direction: 'received',
          counterpartyId: sender.id,
          counterpartyName: sender.name,
          counterpartyClassName: sender.className,
          amount: tf.amount,
          message: tf.message || 'To you - from me',
          isPostalCard: true,
          timestamp: nowIso,
        };

        const senderDisclaimer = buildBalanceDisclaimer(
          sender.id,
          senderPrev,
          senderNew,
          `Approved Gift Postal Card to ${recipient.name}: "To you - from me"`,
          'transfer'
        );

        const recipientDisclaimer = buildBalanceDisclaimer(
          recipient.id,
          recipientPrev,
          recipientNew,
          `Received Gift Postal Card from ${sender.name}: "To you - from me"`,
          'transfer'
        );

        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === sender.id) {
              return {
                ...s,
                currentBalance: senderNew,
                reservedBalance: Math.max(0, (s.reservedBalance || 0) - req.reservedAmount),
                p2pTransfersHistory: [sentRecord, ...(s.p2pTransfersHistory || [])],
                disclaimers: [senderDisclaimer, ...(s.disclaimers || [])],
              };
            }
            if (s.id === recipient.id) {
              return {
                ...s,
                currentBalance: recipientNew,
                p2pTransfersHistory: [receivedRecord, ...(s.p2pTransfersHistory || [])],
                disclaimers: [recipientDisclaimer, ...(s.disclaimers || [])],
              };
            }
            return s;
          })
        );

        addToast(
          'success',
          'Gift Postal Card Approved!',
          `Moved E$${tf.amount}.00 from ${sender.name} to ${recipient.name}.`
        );
      }
    }

    const defaultNote =
      req.type === 'store_purchase'
        ? teacherNote
          ? `Your request will be done asap - Teacher Anthony's ATM (${teacherNote})`
          : "Your request will be done asap - Teacher Anthony's ATM"
        : teacherNote;

    setPendingRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              reviewedAt: nowIso,
              teacherNote: defaultNote,
              loanPaymentData: r.loanPaymentData
                ? { ...r.loanPaymentData, notebookPhotoDataUrl: '' }
                : undefined,
            }
          : r
      )
    );
    removeCloudStudentAction(
      `act_${requestId}`,
      settings.cloudDatabaseUrl,
      settings.cloudSupabaseKey
    );
  };

  // Reject a pending student request and release any held Eurodollars
  const handleRejectPendingRequest = (requestId: string, teacherNote?: string) => {
    const req = pendingRequests.find((r) => r.id === requestId && r.status === 'pending');
    if (!req) return;

    if (req.type === 'contract_submission' && req.contractSubmissionData) {
      handleRejectContractClaim(
        req.contractSubmissionData.contractId,
        req.contractSubmissionData.claimId,
        teacherNote || 'Please revise your contract notebook work',
        false
      );
      return;
    }

    if (req.reservedAmount > 0) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === req.studentId
            ? {
                ...s,
                reservedBalance: Math.max(0, (s.reservedBalance || 0) - req.reservedAmount),
              }
            : s
        )
      );
    }

    setPendingRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
              teacherNote: teacherNote || 'Declined by Teacher',
              loanPaymentData: r.loanPaymentData
                ? { ...r.loanPaymentData, notebookPhotoDataUrl: '' }
                : undefined,
            }
          : r
      )
    );
    removeCloudStudentAction(
      `act_${requestId}`,
      settings.cloudDatabaseUrl,
      settings.cloudSupabaseKey
    );

    addToast(
      'warning',
      'Request Declined',
      req.reservedAmount > 0
        ? `Declined ${req.studentName}'s request and released E$${req.reservedAmount}.00 back to their available balance.`
        : `Declined ${req.studentName}'s request.`
    );
  };

  const handleApproveAllPendingRequests = () => {
    const pendingList = pendingRequests.filter((r) => r.status === 'pending');
    pendingList.forEach((r) => {
      handleApprovePendingRequest(r.id, 'Batch approved by Teacher');
    });
  };

  // Active student object for student view
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentActiveLoan = loans.find(
    (l) => l.studentId === currentStudent?.id && (l.status === 'active' || l.status === 'pending_review')
  );

  const activeLoansCount = loans.filter((l) => l.status !== 'paid').length;
  const pendingReviewsCount = loans.reduce(
    (acc, l) => acc + l.submissions.filter((sub) => sub.status === 'pending').length,
    0
  );
  const pendingWebApprovalsCount = pendingRequests.filter((r) => r.status === 'pending').length;
  const totalCirculation = students.reduce((acc, s) => acc + s.currentBalance, 0);

  const liveCloudClassroomState: CloudClassroomState = {
    version: 4,
    updatedAt: new Date().toISOString(),
    students,
    loans,
    storeCatalog,
    classrooms,
    settings,
    pendingRequests,
    contracts,
  };

  // If opened as the Standalone Student Web App (e.g. on GitHub Pages or ?portal=student)
  if (isStandaloneStudentWeb) {
    return (
      <StudentWebApp
        initialState={liveCloudClassroomState}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen font-sans flex transition-colors duration-300 bg-background text-on-background relative overflow-x-hidden">
      {/* Ambient Caustic Mesh Background Spheres (Prismatic Aero / Aero Crystalline) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden no-print">
        <div
          className="caustic-orb w-[520px] h-[520px] -top-40 -left-28 opacity-40"
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(49, 49, 192, 0.36) 0%, rgba(0, 240, 255, 0) 70%)'
                : 'radial-gradient(circle, rgba(80, 217, 254, 0.35) 0%, rgba(0, 119, 182, 0) 70%)',
          }}
        />
        <div
          className="caustic-orb w-[600px] h-[600px] top-1/4 -right-48 opacity-35"
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(0, 240, 255, 0.22) 0%, rgba(49, 49, 192, 0) 70%)'
                : 'radial-gradient(circle, rgba(71, 88, 179, 0.20) 0%, rgba(80, 217, 254, 0) 70%)',
          }}
        />
        <div
          className="caustic-orb w-[480px] h-[480px] -bottom-36 left-1/3 opacity-30"
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(0, 165, 114, 0.22) 0%, rgba(11, 14, 23, 0) 70%)'
                : 'radial-gradient(circle, rgba(0, 129, 96, 0.16) 0%, rgba(245, 247, 252, 0) 70%)',
          }}
        />
      </div>

      {/* Liquid Glass Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl glass-panel specular-edge flex items-start gap-3 transition-all shadow-2xl ${
              toast.type === 'success'
                ? 'border-tertiary-container/50'
                : toast.type === 'warning'
                ? 'border-amber-400/50'
                : 'border-primary-container/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-tertiary-fixed-dim shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface">
                {toast.title}
              </h4>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* AeroOS Left Navigation Dock */}
      <Sidebar
        activeView={currentView}
        onSelectView={setCurrentView}
        studentsCount={students.length}
        activeLoansCount={activeLoansCount}
        pendingReviewsCount={pendingReviewsCount}
        storeItemsCount={storeCatalog.length}
        contractsCount={contracts.filter((c) => c.isActive).length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onResetDemo={handleResetData}
        theme={theme}
        onToggleTheme={toggleTheme}
        classrooms={classrooms}
        selectedClassFilter={selectedClassId}
        onSelectClassFilter={setSelectedClassId}
        totalCirculation={totalCirculation}
        schoolName={settings.schoolName}
        onOpenClassManager={() => setIsClassManagerModalOpen(true)}
        onOpenReports={() => setIsReportsModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenApprovals={() => setIsApprovalCenterOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        pendingWebApprovalsCount={pendingWebApprovalsCount}
      />

      {/* Main Work Area with Left Sidebar and Top Header Offsets */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        <TopHeader
          activeView={currentView}
          onSelectView={setCurrentView}
          students={students}
          selectedStudentId={selectedStudentId}
          onSelectStudent={setSelectedStudentId}
          settings={settings}
          theme={theme}
          onToggleTheme={toggleTheme}
          pendingWebApprovalsCount={pendingWebApprovalsCount}
          onOpenApprovals={() => setIsApprovalCenterOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
        />

        {/* Main Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 min-w-0 max-w-[1600px] w-full mx-auto">
          {currentView === 'teacher' && (
            <TeacherDashboard
              students={students}
              loans={loans}
              settings={settings}
              classrooms={classrooms}
              theme={theme}
              selectedClassId={selectedClassId}
              onSelectClass={setSelectedClassId}
              onBulkAdjustBalance={handleBulkAdjustBalance}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPrintStudio={() => {
                setPrintTargetStudentId(null);
                setCurrentView('print');
              }}
              onSwitchToStudentView={handleSwitchToStudentView}
              onUpdateCreditLimit={handleUpdateCreditLimit}
              onUpdatePaymentFrequency={handleUpdatePaymentFrequency}
              onDelistStudent={handleDelistStudent}
              onReinstateStudent={handleReinstateStudent}
              onAddStudent={handleAddStudent}
              onAddBulkStudents={handleAddBulkStudents}
              onPrintStudentCard={(studentId) => {
                setPrintTargetStudentId(studentId);
                setCurrentView('print');
              }}
              onApplyDelayPenalty={handleApplyDelayPenalty}
              onIssueLoan={handleIssueLoan}
              onApproveEnglishSubmission={handleApproveEnglishSubmission}
              onRejectEnglishSubmission={handleRejectEnglishSubmission}
              onGradeWorkDirectly={() => {}}
              onSubmitEnglishWork={handleSubmitEnglishWork}
              onAddDailyReward={handleAddDailyEnglishReward}
              onDeleteStudent={handleDeleteStudent}
              onReduceBalance={handleReduceStudentBalance}
              onManualAdjustBalance={handleManualAdjustBalance}
              onCreateClassroom={handleCreateClassroom}
              onUpdateClassroom={handleUpdateClassroom}
              onDeleteClassroom={handleDeleteClassroom}
              onReassignStudents={handleReassignStudents}
              storeCatalog={storeCatalog}
              onUpdateCatalog={setStoreCatalog}
              onOpenStore={(studentId) => {
                if (studentId) {
                  setSelectedStudentId(studentId);
                }
                setCurrentView('store');
              }}
              onGrantCreditLimitRaise={handleGrantCreditLimitRaise}
              onRestoreBackup={handleRestoreBackup}
              onSaveManualSnapshot={handleSaveManualSnapshot}
              pendingWebApprovalsCount={pendingWebApprovalsCount}
              onOpenApprovals={() => setIsApprovalCenterOpen(true)}
              onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
              onResetStudentPassword={handleResetStudentPassword}
              onChangeStudentPassword={handleChangeStudentPassword}
            />
          )}

          {currentView === 'contracts' && (
            <ContractsWallView
              contracts={contracts}
              students={students}
              classrooms={classrooms}
              pendingRequests={pendingRequests}
              selectedClassId={selectedClassId}
              onSelectClassId={setSelectedClassId}
              onCreateContract={handleCreateContract}
              onDeleteContract={handleDeleteContract}
              onToggleContractActive={handleToggleContractActive}
              onReleaseContractSpot={handleReleaseContractSpot}
              onApproveContractClaim={handleApproveContractClaim}
              onRejectContractClaim={handleRejectContractClaim}
              onManualCompleteContractFaceToFace={handleManualCompleteContractFaceToFace}
            />
          )}

          {currentView === 'student_web' && (
            <div className="rounded-3xl overflow-hidden border border-primary-container/35 shadow-2xl">
              <StudentWebApp
                initialState={liveCloudClassroomState}
                isEmbeddedPreview={true}
                onExitStudentWebMode={() => setCurrentView('teacher')}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            </div>
          )}

          {currentView === 'student' &&
            (currentStudent ? (
              <StudentPortal
                student={currentStudent}
                students={students}
                onSelectStudent={setSelectedStudentId}
                activeLoan={studentActiveLoan}
                loans={loans}
                settings={settings}
                onUpdatePaymentFrequency={handleUpdatePaymentFrequency}
                onRequestLoan={(data) => handleIssueLoan(currentStudent.id, data)}
                onSubmitEnglishWork={handleSubmitEnglishWork}
                onAddDailyReward={handleAddDailyEnglishReward}
                onGrantCreditLimitRaise={handleGrantCreditLimitRaise}
                onPrintCard={(studentId) => {
                  setPrintTargetStudentId(studentId);
                  setCurrentView('print');
                }}
                theme={theme}
              />
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center space-y-4 specular-edge">
                <p className="text-base font-headline font-bold text-on-surface">
                  No Cardholders Enrolled
                </p>
                <p className="text-xs text-on-surface-variant font-mono">
                  Return to the Teacher Hub to enroll students or restore your classroom roster.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentView('teacher')}
                  className="liquid-button-primary px-5 py-2.5 rounded-full text-xs font-headline font-bold"
                >
                  Open Teacher Hub
                </button>
              </div>
            ))}

          {currentView === 'grants' && (
            <EnglishDailyDollarsSection
              students={students}
              settings={settings}
              onAddDailyReward={handleAddDailyEnglishReward}
              onManualAdjustBalance={handleManualAdjustBalance}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
            />
          )}

          {currentView === 'store' && (
            <ClassroomStoreView
              students={students}
              selectedStudentId={selectedStudentId}
              onSelectStudent={setSelectedStudentId}
              storeCatalog={storeCatalog}
              onUpdateCatalog={setStoreCatalog}
              classrooms={classrooms}
              selectedClassId={selectedClassId}
              onPurchaseItem={(studentId, amount, item, _finalPrice, quantity, allocations) => {
                handleReduceStudentBalance(studentId, amount, item.name, {
                  itemId: item.id,
                  itemName: item.name,
                  originalPrice: item.basePrice,
                  discountPercent: item.discountPercent,
                  quantity: quantity || 1,
                  allocations,
                });
              }}
              onCheckoutCart={handleCheckoutCart}
              onCustomDeduction={handleReduceStudentBalance}
              isTeacher={true}
              theme={theme}
            />
          )}

          {currentView === 'print' && (
            <PrintableCards
              students={students}
              settings={settings}
              classrooms={classrooms}
              initialSelectedStudentId={printTargetStudentId}
              onBack={() => {
                setPrintTargetStudentId(null);
                setCurrentView('teacher');
              }}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={(newSettings) => {
            setSettings(newSettings);
            addToast('success', 'Settings Saved', 'Classroom rates and parameters updated.');
          }}
        />
      )}

      {/* Classroom Didactic Rules Reference Modal */}
      {isRulesOpen && (
        <ClassroomRulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          settings={settings}
          theme={theme}
        />
      )}

      {/* Global Data Backup & Snapshot Modal */}
      {isBackupModalOpen && (
        <DataBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          students={students}
          loans={loans}
          storeItems={storeCatalog}
          classrooms={classrooms}
          pendingRequests={pendingRequests}
          settings={settings}
          onRestoreBackup={handleRestoreBackup}
          onSaveManualSnapshot={handleSaveManualSnapshot}
        />
      )}

      {/* Global Class Manager Modal */}
      {isClassManagerModalOpen && (
        <ClassManagerModal
          isOpen={isClassManagerModalOpen}
          onClose={() => setIsClassManagerModalOpen(false)}
          classrooms={classrooms}
          students={students}
          onCreateClassroom={handleCreateClassroom}
          onUpdateClassroom={handleUpdateClassroom}
          onDeleteClassroom={handleDeleteClassroom}
          onReassignStudents={handleReassignStudents}
        />
      )}

      {/* Global Student Comprehensive Reports Modal */}
      {isReportsModalOpen && (
        <StudentReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
          students={students}
          loans={loans}
          settings={settings}
        />
      )}

      {/* Live Student Web App Approval Center Modal */}
      {isApprovalCenterOpen && (
        <TeacherApprovalCenterModal
          isOpen={isApprovalCenterOpen}
          onClose={() => setIsApprovalCenterOpen(false)}
          requests={pendingRequests}
          students={students}
          settings={settings}
          onApproveRequest={handleApprovePendingRequest}
          onRejectRequest={handleRejectPendingRequest}
          onApproveAllPending={handleApproveAllPendingRequests}
        />
      )}

      {/* Real-Time Cloud Sync & Student Web App Link Modal */}
      {isCloudSyncModalOpen && (
        <CloudSyncModal
          isOpen={isCloudSyncModalOpen}
          onClose={() => setIsCloudSyncModalOpen(false)}
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
          }}
          onForcePushToCloud={(dbUrl, supabaseKey) =>
            pushClassroomStateToCloud(
              {
                ...liveCloudClassroomState,
                settings: {
                  ...settings,
                  cloudDatabaseUrl: dbUrl,
                  cloudSupabaseKey: supabaseKey,
                },
              },
              dbUrl,
              supabaseKey,
              { force: true }
            )
          }
          onOpenStudentWebPreview={() => setCurrentView('student_web')}
        />
      )}
    </div>
  );
}
