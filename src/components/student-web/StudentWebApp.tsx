import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CreditCard,
  LogIn,
  LogOut,
  ShoppingBag,
  Send,
  BookOpen,
  User,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  Upload,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RefreshCw,
  Sun,
  Moon,
  Plus,
  Minus,
  Trash2,
  Eye,
  EyeOff,
  HelpCircle,
  Check,
  FileText,
  Award,
  Gift,
  ScrollText,
  Calendar,
  Layers,
  RotateCcw,
  Printer,
  Scissors,
} from 'lucide-react';
import {
  Student,
  Loan,
  LoanRepaymentMethod,
  StoreItem,
  Classroom,
  TeacherSettings,
  PendingStudentRequest,
  BalanceDisclaimerNotice,
  ClassroomContract,
  ContractClaim,
  StoreRedemptionAllocation,
  P2PTransferRecord,
} from '../../types';
import {
  getCreditTier,
  calculateTotalDue,
  getDaysDifference,
  DEFAULT_TEACHER_SETTINGS,
} from '../../utils/creditCalculator';
import { calculateEffectiveItemPrice } from '../../data/storeCatalog';
import { CreditCardVisual } from '../CreditCardVisual';
import { StoreItemVisual } from '../StoreItemVisual';
import { StudentAvatar } from '../StudentAvatar';
import {
  StoreRedemptionConfigModal,
  getStoreRedemptionRequirement,
  formatStoreAllocationsSummary,
} from '../StoreRedemptionConfigModal';
import { StudentCardPrintModal } from '../StudentCardPrintModal';
import {
  PRESET_BANK_AVATARS,
  compressImageFile,
} from '../../utils/imageCompressor';
import {
  CloudClassroomState,
  dispatchStudentAction,
  fetchClassroomStateFromCloud,
  subscribeToClassroomRealtime,
} from '../../services/cloudSync';

interface StudentWebAppProps {
  initialState?: CloudClassroomState;
  onExitStudentWebMode?: () => void;
  isEmbeddedPreview?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

type StudentTab = 'wallet' | 'loans' | 'contracts' | 'store' | 'transfer' | 'profile';

const SAVED_STUDENT_SESSION_KEY = 'esl_student_web_logged_in_id';

export const QUICK_GIFT_REPLIES = [
  'thanks!',
  'really appreciate it',
  'Owww thanks!',
  'I am grateful',
  'God bless you!',
];

export const StudentWebApp: React.FC<StudentWebAppProps> = ({
  initialState,
  onExitStudentWebMode,
  isEmbeddedPreview = false,
  theme,
  onToggleTheme,
}) => {
  const [cloudState, setCloudState] = useState<CloudClassroomState | null>(
    initialState || null
  );
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(!initialState);
  const [syncSource, setSyncSource] = useState<'cloud' | 'local' | 'none'>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toLocaleTimeString());

  // Auth state
  const [loggedInStudentId, setLoggedInStudentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SAVED_STUDENT_SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [fullNameInput, setFullNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showCvvHelp, setShowCvvHelp] = useState(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<StudentTab>('wallet');

  // Toast notifications
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const triggerToast = (
    type: 'success' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  // Sync with parent initialState if provided (e.g. when previewing inside ATM 4.0)
  useEffect(() => {
    if (initialState) {
      setCloudState(initialState);
      setIsLoadingCloud(false);
    }
  }, [initialState]);

  // Initial fetch & real-time subscription
  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      const res = await fetchClassroomStateFromCloud();
      if (!mounted) return;
      if (res.state) {
        setCloudState(res.state);
        setSyncSource(res.source);
        setLastSyncedAt(new Date().toLocaleTimeString());
      }
      setIsLoadingCloud(false);
    };

    loadInitial();

    const unsubscribe = subscribeToClassroomRealtime({
      role: 'student',
      onStateSync: (newState) => {
        if (!mounted) return;
        setCloudState(newState);
        setLastSyncedAt(new Date().toLocaleTimeString());
      },
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const students: Student[] = cloudState?.students || [];
  const loans: Loan[] = cloudState?.loans || [];
  const storeCatalog: StoreItem[] = cloudState?.storeCatalog || [];
  const classrooms: Classroom[] = cloudState?.classrooms || [];
  const settings: TeacherSettings = cloudState?.settings || DEFAULT_TEACHER_SETTINGS;
  const pendingRequests: PendingStudentRequest[] = cloudState?.pendingRequests || [];
  const contracts: ClassroomContract[] = cloudState?.contracts || [];

  const currentStudent = useMemo(
    () => students.find((s) => s.id === loggedInStudentId) || null,
    [students, loggedInStudentId]
  );

  // Reserved balance & available balance calculation
  const reservedBalance = useMemo(() => {
    if (!currentStudent) return 0;
    const fromRequests = pendingRequests
      .filter((r) => r.studentId === currentStudent.id && r.status === 'pending')
      .reduce((acc, r) => acc + (r.reservedAmount || 0), 0);
    return Math.max(currentStudent.reservedBalance || 0, fromRequests);
  }, [currentStudent, pendingRequests]);

  const availableBalance = useMemo(() => {
    if (!currentStudent) return 0;
    return Math.max(0, currentStudent.currentBalance - reservedBalance);
  }, [currentStudent, reservedBalance]);

  const activeLoan = useMemo(() => {
    if (!currentStudent) return null;
    return (
      loans.find(
        (l) =>
          l.studentId === currentStudent.id &&
          (l.status === 'active' || l.status === 'pending_review')
      ) || null
    );
  }, [loans, currentStudent]);

  const studentLoansHistory = useMemo(() => {
    if (!currentStudent) return [];
    return loans.filter((l) => l.studentId === currentStudent.id);
  }, [loans, currentStudent]);

  const myPendingRequests = useMemo(() => {
    if (!currentStudent) return [];
    return pendingRequests.filter((r) => r.studentId === currentStudent.id);
  }, [pendingRequests, currentStudent]);

  const unacknowledgedDisclaimers = useMemo(() => {
    if (!currentStudent) return [];
    return (currentStudent.disclaimers || []).filter((d) => !d.acknowledgedAt);
  }, [currentStudent]);

  // ------------------------------------------------------------------
  // 1. LOGIN & LOGOUT HANDLERS
  // ------------------------------------------------------------------
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const normalizedName = fullNameInput.trim().replace(/\s+/g, ' ').toUpperCase();
    const trimmedPass = passwordInput.trim();

    if (!normalizedName || !trimmedPass) {
      setLoginError('Please enter your FULL NAME IN CAPS and your PIN/Password.');
      return;
    }

    const matchedStudent = students.find(
      (s) => s.name.trim().replace(/\s+/g, ' ').toUpperCase() === normalizedName
    );

    if (!matchedStudent) {
      setLoginError(
        'Student not found. Check your spelling and make sure you entered your exact FULL NAME IN CAPS.'
      );
      return;
    }

    const hasCustomPass =
      matchedStudent.customPassword && matchedStudent.customPassword.trim().length > 0;
    const expectedSecret = hasCustomPass
      ? matchedStudent.customPassword!.trim()
      : matchedStudent.cvv.trim();

    if (trimmedPass !== expectedSecret) {
      if (hasCustomPass && trimmedPass === matchedStudent.cvv.trim()) {
        setLoginError(
          'You previously changed your password from your card CVV. Please enter your custom password, or ask your teacher to reset your password in ATM 4.0.'
        );
      } else {
        setLoginError(
          hasCustomPass
            ? 'Incorrect password. If you forgot your password, ask your teacher to reset it to your card CVV.'
            : 'Incorrect Card PIN. Enter the 3-digit CVV security code printed on the back of your SmartPass card.'
        );
      }
      return;
    }

    setLoggedInStudentId(matchedStudent.id);
    try {
      localStorage.setItem(SAVED_STUDENT_SESSION_KEY, matchedStudent.id);
    } catch {
      // ignore
    }
    setPasswordInput('');
    setLoginError('');
  };

  const handleLogout = () => {
    setLoggedInStudentId(null);
    try {
      localStorage.removeItem(SAVED_STUDENT_SESSION_KEY);
    } catch {
      // ignore
    }
    setFullNameInput('');
    setPasswordInput('');
    setActiveTab('wallet');
  };

  // ------------------------------------------------------------------
  // 2. ACKNOWLEDGE BALANCE DISCLAIMER HANDLER
  // ------------------------------------------------------------------
  const handleAcknowledgeDisclaimers = async (ids: string[]) => {
    if (!currentStudent || ids.length === 0) return;
    const res = await dispatchStudentAction(
      {
        id: `ack_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'ACKNOWLEDGE_DISCLAIMERS',
        studentId: currentStudent.id,
        disclaimerIds: ids,
        createdAt: new Date().toISOString(),
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    triggerToast('info', 'Notice Acknowledged', 'Official bank balance notice marked as read.');
  };

  // ------------------------------------------------------------------
  // 3. LOAN REQUEST (INSTANT OPEN) & NOTEBOOK PHOTO REPAYMENT HANDLERS
  // ------------------------------------------------------------------
  const [loanPrincipalInput, setLoanPrincipalInput] = useState<number>(50);
  const [loanTypeInput, setLoanTypeInput] = useState<'short' | 'big'>('short');
  const [loanDurationInput, setLoanDurationInput] = useState<number>(5);
  const [loanNotesInput, setLoanNotesInput] = useState<string>('');
  const [selectedRepaymentMethod, setSelectedRepaymentMethod] = useState<LoanRepaymentMethod>('sentences');
  const [activeRepaymentMethodChoice, setActiveRepaymentMethodChoice] = useState<LoanRepaymentMethod>('sentences');

  // Notebook Repayment state
  const [hasDecoratedNotebook, setHasDecoratedNotebook] = useState<boolean>(false);
  const [notebookPhotoDataUrl, setNotebookPhotoDataUrl] = useState<string>('');
  const [notebookStudentNotes, setNotebookStudentNotes] = useState<string>('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [isPrintCardModalOpen, setIsPrintCardModalOpen] = useState<boolean>(false);
  const notebookFileInputRef = useRef<HTMLInputElement>(null);

  const remainingDebt = activeLoan ? Math.max(0, activeLoan.totalDue - activeLoan.amountRepaid) : 0;

  const currentRepaymentMethod: LoanRepaymentMethod =
    activeLoan?.repaymentMethod || activeRepaymentMethodChoice;

  const currentRepaymentUnitValue =
    currentRepaymentMethod === 'phrasal_verbs'
      ? settings.phrasalVerbValue
      : currentRepaymentMethod === 'words'
      ? settings.wordValue
      : settings.sentenceValue;

  const currentRepaymentMethodLabel =
    currentRepaymentMethod === 'phrasal_verbs'
      ? 'Phrasal Verbs'
      : currentRepaymentMethod === 'words'
      ? 'Vocabulary Words'
      : 'English Sentences';

  const currentRequiredCount =
    activeLoan?.repaymentRequirement?.requiredCount ||
    Math.max(1, Math.ceil(remainingDebt / currentRepaymentUnitValue));

  const calculatedRepaymentCredit = currentRequiredCount * currentRepaymentUnitValue;

  const handleNotebookPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImageFile(file, {
        maxDimension: 1200,
        quality: 0.78,
        squareCrop: false,
      });
      setNotebookPhotoDataUrl(compressed);
      triggerToast(
        'success',
        'Notebook Photo Attached!',
        'Your notebook photo is ready to submit for teacher approval.'
      );
    } catch {
      triggerToast('warning', 'Photo Error', 'Could not read image file. Please try another photo.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleSubmitLoanRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (currentStudent.cardStatus === 'delisted') {
      triggerToast('warning', 'Card Delisted', 'Delisted accounts cannot open new loans.');
      return;
    }

    if (activeLoan) {
      triggerToast('warning', 'Active Loan Exists', 'You already have an active loan.');
      return;
    }

    const clampedPrincipal = Math.min(
      currentStudent.maxLoanLimit,
      Math.max(10, Math.round(loanPrincipalInput))
    );

    const now = new Date();
    const dueDate = new Date(now.getTime() + loanDurationInput * 86400000).toISOString();
    const effectiveRate = settings.baseInterestRate;
    const totalDue = calculateTotalDue(clampedPrincipal, effectiveRate);

    const unitVal =
      selectedRepaymentMethod === 'phrasal_verbs'
        ? settings.phrasalVerbValue
        : selectedRepaymentMethod === 'words'
        ? settings.wordValue
        : settings.sentenceValue;
    const reqCount = Math.max(1, Math.ceil(totalDue / unitVal));
    const methodLabel =
      selectedRepaymentMethod === 'phrasal_verbs'
        ? 'Phrasal Verbs'
        : selectedRepaymentMethod === 'words'
        ? 'Vocabulary Words'
        : 'English Sentences';

    const newLoan: Loan = {
      id: `ln-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: currentStudent.id,
      principal: clampedPrincipal,
      baseInterestRate: settings.baseInterestRate,
      delayPenaltyRate: settings.delayPenaltyIncrement,
      delaysCount: 0,
      effectiveInterestRate: effectiveRate,
      totalDue,
      amountRepaid: 0,
      loanType: loanTypeInput,
      durationDays: loanDurationInput,
      createdAt: now.toISOString(),
      dueDate,
      status: 'active',
      submissions: [],
      notes: loanNotesInput.trim() || 'Opened via Student Web App',
      principalDisbursed: false,
      repaymentMethod: selectedRepaymentMethod,
      repaymentRequirement: {
        method: selectedRepaymentMethod,
        methodLabel,
        unitValue: unitVal,
        requiredCount: reqCount,
        totalCreditValue: reqCount * unitVal,
      },
    };

    const res = await dispatchStudentAction(
      {
        id: `act_open_${newLoan.id}`,
        type: 'OPEN_LOAN',
        studentId: currentStudent.id,
        loan: newLoan,
        createdAt: newLoan.createdAt,
      },
      cloudState
    );

    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    setLoanNotesInput('');
    triggerToast(
      'success',
      'Loan Opened Immediately!',
      `Task: Write ${reqCount} ${methodLabel} in your notebook. Send your photo to receive E$${clampedPrincipal}.00 instantly!`
    );
  };

  const handleSubmitNotebookPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !activeLoan) return;

    if (calculatedRepaymentCredit <= 0) {
      triggerToast(
        'warning',
        'Add English Tasks',
        'Please specify at least 1 sentence, word, or phrasal verb completed in your notebook.'
      );
      return;
    }

    if (!notebookPhotoDataUrl) {
      triggerToast(
        'warning',
        'Notebook Photo Required',
        'Please upload or take a photo of your notebook showing your English work.'
      );
      return;
    }

    const effectiveMethod: LoanRepaymentMethod =
      activeLoan.repaymentMethod || activeRepaymentMethodChoice;
    const unitVal =
      effectiveMethod === 'phrasal_verbs'
        ? settings.phrasalVerbValue
        : effectiveMethod === 'words'
        ? settings.wordValue
        : settings.sentenceValue;
    const reqCount =
      activeLoan.repaymentRequirement?.requiredCount ||
      Math.max(1, Math.ceil(remainingDebt / unitVal));
    const methodLabel =
      activeLoan.repaymentRequirement?.methodLabel ||
      (effectiveMethod === 'phrasal_verbs'
        ? 'Phrasal Verbs'
        : effectiveMethod === 'words'
        ? 'Vocabulary Words'
        : 'English Sentences');
    const totalCreditValue = reqCount * unitVal;

    const request: PendingStudentRequest = {
      id: `req_pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'loan_payment',
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      classId: currentStudent.classId,
      className: currentStudent.className,
      createdAt: new Date().toISOString(),
      status: 'pending',
      reservedAmount: 0,
      loanPaymentData: {
        loanId: activeLoan.id,
        repaymentMethod: effectiveMethod,
        repaymentMethodLabel: methodLabel,
        requiredCount: reqCount,
        unitValue: unitVal,
        sentencesCount: effectiveMethod === 'sentences' ? reqCount : 0,
        wordsCount: effectiveMethod === 'words' ? reqCount : 0,
        phrasalVerbsCount: effectiveMethod === 'phrasal_verbs' ? reqCount : 0,
        totalCreditValue,
        hasDecoratedPresentation: hasDecoratedNotebook,
        notebookPhotoDataUrl,
        studentNotes: notebookStudentNotes.trim() || undefined,
      },
    };

    const res = await dispatchStudentAction(
      {
        id: `act_${request.id}`,
        type: 'SUBMIT_REQUEST',
        request,
        createdAt: request.createdAt,
      },
      cloudState
    );

    if (res.updatedState) {
      setCloudState(res.updatedState);
    }

    setNotebookPhotoDataUrl('');
    setNotebookStudentNotes('');
    triggerToast(
      'success',
      'Notebook Photo Sent!',
      `Once Teacher Anthony approves your photo in ATM 4.0, you will instantly receive your loan money (E$${activeLoan.principal}.00) in your wallet!`
    );
  };

  // ------------------------------------------------------------------
  // 3B. CONTRACTS / EVENTS WALL HANDLERS
  // ------------------------------------------------------------------
  const [activeContractUploadId, setActiveContractUploadId] = useState<string | null>(null);
  const [contractPhotoDataUrl, setContractPhotoDataUrl] = useState<string>('');
  const [contractStudentNotes, setContractStudentNotes] = useState<string>('');
  const contractFileInputRef = useRef<HTMLInputElement>(null);

  const availableContracts = useMemo(() => {
    if (!currentStudent) return [];
    return contracts.filter((c) => {
      if (!c.isActive) {
        // Still show if this student has a claim on it
        return c.claims.some((cl) => cl.studentId === currentStudent.id);
      }
      if (!c.classroomId || c.classroomId === 'all') return true;
      return c.classroomId === currentStudent.classId;
    });
  }, [contracts, currentStudent]);

  const handleReserveContractSpot = async (contract: ClassroomContract) => {
    if (!currentStudent) return;
    if (currentStudent.cardStatus === 'delisted') {
      triggerToast('warning', 'Card Delisted', 'Delisted cards cannot claim contracts.');
      return;
    }
    if (contract.spotsRemaining <= 0) {
      triggerToast('warning', 'No Spots Left', 'All spots for this contract have been taken.');
      return;
    }
    const existingClaim = contract.claims.find((cl) => cl.studentId === currentStudent.id);
    if (existingClaim) {
      triggerToast('info', 'Already Reserved', 'You already reserved a spot on this contract!');
      return;
    }

    const nowIso = new Date().toISOString();
    const claim: ContractClaim = {
      id: `clm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      contractId: contract.id,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      classId: currentStudent.classId,
      className: currentStudent.className,
      status: 'reserved',
      reservedAt: nowIso,
    };

    const res = await dispatchStudentAction(
      {
        id: `act_res_${claim.id}`,
        type: 'RESERVE_CONTRACT',
        contractId: contract.id,
        claim,
        createdAt: nowIso,
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    setActiveContractUploadId(contract.id);
    triggerToast(
      'success',
      'Contract Spot Reserved!',
      `1 spot is reserved for you on "${contract.title}". Complete it in your notebook and upload a photo to earn +E$${contract.rewardAmount}!`
    );
  };

  const handleReleaseContractSpot = async (contract: ClassroomContract, claim: ContractClaim) => {
    if (!currentStudent) return;
    const nowIso = new Date().toISOString();
    const res = await dispatchStudentAction(
      {
        id: `act_rel_${claim.id}_${Date.now()}`,
        type: 'RELEASE_CONTRACT',
        contractId: contract.id,
        claimId: claim.id,
        studentId: currentStudent.id,
        createdAt: nowIso,
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    if (activeContractUploadId === contract.id) {
      setActiveContractUploadId(null);
      setContractPhotoDataUrl('');
      setContractStudentNotes('');
    }
    triggerToast(
      'info',
      'Spot Released',
      `Your spot on "${contract.title}" has been returned to the Contracts Wall.`
    );
  };

  const handleContractPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    try {
      const compressed = await compressImageFile(file, {
        maxDimension: 1200,
        quality: 0.78,
        squareCrop: false,
      });
      setContractPhotoDataUrl(compressed);
      triggerToast('success', 'Contract Photo Attached!', 'Ready to send for teacher approval.');
    } catch {
      triggerToast('warning', 'Photo Error', 'Could not read image file.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleSubmitContractPhoto = async (contract: ClassroomContract, claim: ContractClaim) => {
    if (!currentStudent) return;
    if (!contractPhotoDataUrl) {
      triggerToast(
        'warning',
        'Notebook Photo Required',
        'Please take or upload a photo of your notebook showing the completed contract.'
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const request: PendingStudentRequest = {
      id: `req_contract_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'contract_submission',
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      classId: currentStudent.classId,
      className: currentStudent.className,
      createdAt: nowIso,
      status: 'pending',
      reservedAmount: 0,
      contractSubmissionData: {
        contractId: contract.id,
        claimId: claim.id,
        contractTitle: contract.title,
        rewardAmount: contract.rewardAmount,
        creditScoreBonus: contract.creditScoreBonus,
        notebookPhotoDataUrl: contractPhotoDataUrl,
        studentNotes: contractStudentNotes.trim() || undefined,
      },
    };

    const res = await dispatchStudentAction(
      {
        id: `act_${request.id}`,
        type: 'SUBMIT_REQUEST',
        request,
        createdAt: nowIso,
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    setActiveContractUploadId(null);
    setContractPhotoDataUrl('');
    setContractStudentNotes('');
    triggerToast(
      'success',
      'Contract Sent for Approval!',
      `Once Teacher Anthony approves your notebook photo, you will receive +E$${contract.rewardAmount}.00 in your wallet!`
    );
  };

  // ------------------------------------------------------------------
  // 4. SCHOOL STORE CART & ORDER HANDLERS (WITH SKIP HW / EXTRA POINTS POPUP)
  // ------------------------------------------------------------------
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartAllocations, setCartAllocations] = useState<
    Record<string, StoreRedemptionAllocation[]>
  >({});
  const [configuringStoreItem, setConfiguringStoreItem] = useState<{
    item: StoreItem;
    targetQty: number;
  } | null>(null);

  const availableStoreItems = useMemo(() => {
    if (!currentStudent) return [];
    return storeCatalog.filter((item) => {
      if (item.isHidden) return false;
      if (!item.classroomId || item.classroomId === 'all') return true;
      return item.classroomId === currentStudent.classId;
    });
  }, [storeCatalog, currentStudent]);

  const cartList = useMemo(() => {
    return Object.entries(cart)
      .map(([itemId, rawQty]) => {
        const qty = Number(rawQty);
        const item = availableStoreItems.find((i) => i.id === itemId);
        if (!item || qty <= 0) return null;
        const unitPrice = calculateEffectiveItemPrice(item);
        return {
          item,
          quantity: qty,
          unitPrice,
          lineTotal: unitPrice * qty,
          allocations: cartAllocations[itemId],
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [cart, availableStoreItems, cartAllocations]);

  const cartTotal = useMemo(
    () => cartList.reduce((acc, c) => acc + c.lineTotal, 0),
    [cartList]
  );

  const handleAddToCart = (item: StoreItem) => {
    const currentQty = cart[item.id] || 0;
    if (!item.unlimitedStock && currentQty >= item.stock) {
      triggerToast('warning', 'Max Stock Reached', `Only ${item.stock} available in stock.`);
      return;
    }
    const nextQty = currentQty + 1;
    if (getStoreRedemptionRequirement(item)) {
      setConfiguringStoreItem({ item, targetQty: nextQty });
      return;
    }
    setCart((prev) => ({ ...prev, [item.id]: nextQty }));
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    const item = availableStoreItems.find((i) => i.id === itemId);
    const currentQty = cart[itemId] || 0;
    const next = currentQty + delta;
    if (next <= 0) {
      setCart((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
      setCartAllocations((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
      return;
    }
    if (item && getStoreRedemptionRequirement(item)) {
      setConfiguringStoreItem({ item, targetQty: next });
      return;
    }
    setCart((prev) => ({ ...prev, [itemId]: next }));
  };

  const handleSubmitStoreOrder = async () => {
    if (!currentStudent || cartList.length === 0) return;

    if (currentStudent.cardStatus === 'delisted') {
      triggerToast('warning', 'Card Delisted', 'Delisted cards cannot purchase store items.');
      return;
    }

    if (cartTotal > availableBalance) {
      triggerToast(
        'warning',
        'Insufficient Available Funds',
        `Order costs E$${cartTotal}.00, but you have E$${availableBalance}.00 available (E$${reservedBalance}.00 is currently held for pending approvals).`
      );
      return;
    }

    const request: PendingStudentRequest = {
      id: `req_store_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'store_purchase',
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      classId: currentStudent.classId,
      className: currentStudent.className,
      createdAt: new Date().toISOString(),
      status: 'pending',
      reservedAmount: cartTotal,
      storePurchaseData: {
        items: cartList.map((c) => ({
          itemId: c.item.id,
          itemName: c.item.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          originalPrice: c.item.basePrice,
          discountPercent: c.item.discountPercent || 0,
          allocations: c.allocations,
        })),
        totalPrice: cartTotal,
      },
    };

    const res = await dispatchStudentAction(
      {
        id: `act_${request.id}`,
        type: 'SUBMIT_REQUEST',
        request,
        createdAt: request.createdAt,
      },
      cloudState
    );

    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    setCart({});
    setCartAllocations({});
    triggerToast(
      'success',
      'Order Sent for Approval!',
      `E$${cartTotal}.00 has been reserved. Once Teacher Anthony approves it, you will get the confirmation: "Your request will be done asap - Teacher Anthony's ATM"`
    );
  };

  // ------------------------------------------------------------------
  // 5. P2P GIFT POSTAL CARD ("To you - from me") & QUICK REPLIES
  // ------------------------------------------------------------------
  const [recipientId, setRecipientId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [friendSearch, setFriendSearch] = useState<string>('');

  const eligibleClassmates = useMemo(() => {
    if (!currentStudent) return [];
    return students.filter((s) => {
      if (s.id === currentStudent.id) return false;
      if (s.cardStatus === 'delisted') return false;
      if (!settings.allowCrossClassTransfers && currentStudent.classId) {
        if (s.classId !== currentStudent.classId) return false;
      }
      if (friendSearch.trim()) {
        return s.name.toLowerCase().includes(friendSearch.trim().toLowerCase());
      }
      return true;
    });
  }, [students, currentStudent, settings.allowCrossClassTransfers, friendSearch]);

  const handleSendP2PTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    if (currentStudent.cardStatus === 'delisted') {
      triggerToast('warning', 'Card Delisted', 'Delisted cards cannot send transfers.');
      return;
    }

    const recipient = students.find((s) => s.id === recipientId);
    if (!recipient) {
      triggerToast('warning', 'Select a Friend', 'Please choose a classmate to send your Gift Postal Card to.');
      return;
    }

    const amountNum = Math.floor(Number(transferAmount));
    if (!amountNum || amountNum <= 0) {
      triggerToast('warning', 'Invalid Amount', 'Please enter a valid Eurodollar amount greater than E$0.');
      return;
    }

    if (amountNum > availableBalance) {
      triggerToast(
        'warning',
        'Insufficient Available Balance',
        `You tried to send E$${amountNum}.00, but you only have E$${availableBalance}.00 available.`
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const transferId = `p2p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const res = await dispatchStudentAction(
      {
        id: `act_${transferId}`,
        type: 'SEND_P2P_POSTCARD',
        transferId,
        senderId: currentStudent.id,
        senderName: currentStudent.name,
        senderClassName: currentStudent.className,
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientClassName: recipient.className,
        amount: amountNum,
        createdAt: nowIso,
      },
      cloudState
    );

    if (res.updatedState) {
      setCloudState(res.updatedState);
    }

    setTransferAmount('');
    triggerToast(
      'success',
      'Gift Postal Card Sent Instantly! 🎁',
      `Sent E$${amountNum}.00 to ${recipient.name} with postal card "To you - from me"!`
    );
  };

  const handleReplyToPostalCard = async (tx: P2PTransferRecord, replyText: string) => {
    if (!currentStudent || tx.direction !== 'received') return;
    const nowIso = new Date().toISOString();
    const res = await dispatchStudentAction(
      {
        id: `act_reply_${tx.id}_${Date.now()}`,
        type: 'REPLY_P2P_POSTCARD',
        transferId: tx.id,
        recipientId: currentStudent.id,
        recipientName: currentStudent.name,
        senderId: tx.counterpartyId,
        replyText,
        createdAt: nowIso,
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    triggerToast(
      'success',
      'Thank-You Reply Sent! 💌',
      `Replied "${replyText}" to ${tx.counterpartyName}!`
    );
  };

  // Cancel pending request (releases reserved funds immediately)
  const handleCancelPendingRequest = async (req: PendingStudentRequest) => {
    if (!currentStudent || req.status !== 'pending') return;
    const res = await dispatchStudentAction(
      {
        id: `cancel_${req.id}_${Date.now()}`,
        type: 'CANCEL_REQUEST',
        requestId: req.id,
        studentId: currentStudent.id,
        createdAt: new Date().toISOString(),
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    triggerToast(
      'info',
      'Request Cancelled',
      req.reservedAmount > 0
        ? `Your pending request was cancelled and E$${req.reservedAmount}.00 was returned to your available balance.`
        : 'Your pending request was cancelled.'
    );
  };

  // ------------------------------------------------------------------
  // 6. PROFILE PICTURE & PASSWORD CHANGE HANDLERS
  // ------------------------------------------------------------------
  const [currentPassVerify, setCurrentPassVerify] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPresetAvatar = async (presetId: string) => {
    if (!currentStudent) return;
    const res = await dispatchStudentAction(
      {
        id: `prof_av_${Date.now()}`,
        type: 'UPDATE_PROFILE',
        studentId: currentStudent.id,
        avatarUrl: presetId,
        createdAt: new Date().toISOString(),
      },
      cloudState
    );
    if (res.updatedState) {
      setCloudState(res.updatedState);
    }
    triggerToast('success', 'Avatar Updated!', 'Your new bank profile avatar is live.');
  };

  const handleUploadCustomAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentStudent) return;
    try {
      const compressedAvatar = await compressImageFile(file, {
        maxDimension: 256,
        quality: 0.82,
        squareCrop: true,
      });
      const res = await dispatchStudentAction(
        {
          id: `prof_img_${Date.now()}`,
          type: 'UPDATE_PROFILE',
          studentId: currentStudent.id,
          avatarUrl: compressedAvatar,
          createdAt: new Date().toISOString(),
        },
        cloudState
      );
      if (res.updatedState) {
        setCloudState(res.updatedState);
      }
      triggerToast('success', 'Profile Picture Saved!', 'Your custom profile picture is now live.');
    } catch {
      triggerToast('warning', 'Image Error', 'Could not process that photo. Please try another.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    const currentExpected =
      currentStudent.customPassword && currentStudent.customPassword.trim().length > 0
        ? currentStudent.customPassword.trim()
        : currentStudent.cvv.trim();

    if (currentPassVerify.trim() !== currentExpected) {
      triggerToast(
        'warning',
        'Current PIN/Password Incorrect',
        'Please enter your current PIN (or custom password) accurately.'
      );
      return;
    }

    if (newPasswordInput.trim().length < 3) {
      triggerToast(
        'warning',
        'Password Too Short',
        'Your new password must be at least 3 characters long.'
      );
      return;
    }

    if (newPasswordInput.trim() !== confirmPasswordInput.trim()) {
      triggerToast('warning', 'Passwords Do Not Match', 'Please make sure both password fields match.');
      return;
    }

    const res = await dispatchStudentAction(
      {
        id: `prof_pw_${Date.now()}`,
        type: 'UPDATE_PROFILE',
        studentId: currentStudent.id,
        customPassword: newPasswordInput.trim(),
        createdAt: new Date().toISOString(),
      },
      cloudState
    );

    if (res.updatedState) {
      setCloudState(res.updatedState);
    }

    setCurrentPassVerify('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    triggerToast(
      'success',
      'Password Updated!',
      'Your new custom password is saved. Use it with your FULL NAME IN CAPS next time you log in!'
    );
  };

  // ==================================================================
  // RENDER LOGIN VIEW IF NOT AUTHENTICATED
  // ==================================================================
  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
        {/* Top utility bar */}
        <div className="flex items-center justify-between max-w-md w-full mx-auto z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
              {isLoadingCloud
                ? 'Connecting to Reserve...'
                : `ATM 4.0 Live Network (${students.length} Cardholders)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-full glass-pill text-on-surface hover:border-primary-container/50 transition-all"
              title="Toggle Light/Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
            {onExitStudentWebMode && (
              <button
                type="button"
                onClick={onExitStudentWebMode}
                className="px-3 py-1.5 rounded-full glass-pill text-xs font-mono font-bold text-primary-container hover:border-primary-container/60"
              >
                {isEmbeddedPreview ? 'Back to Teacher Hub' : 'Teacher Mode'}
              </button>
            )}
          </div>
        </div>

        {/* Center Login Card */}
        <div className="max-w-md w-full mx-auto my-auto glass-panel rounded-3xl p-6 sm:p-8 specular-edge shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container via-secondary-container to-surface-container-highest mx-auto flex items-center justify-center shadow-lg border border-primary-container/40">
              <CreditCard className="w-8 h-8 text-primary-container" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary-container font-bold">
              {settings.schoolName || 'Oxford English Academy'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-headline font-extrabold text-on-surface tracking-tight">
              Student SmartPass ATM
            </h1>
            <p className="text-xs text-on-surface-variant">
              Sign in with your <strong className="text-on-surface">FULL NAME IN CAPS</strong> and your{' '}
              <strong className="text-on-surface">Card PIN (CVV)</strong> or custom password.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-error-container/25 border border-error/40 flex items-start gap-2.5 text-error text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                1. Cardholder Full Name (IN CAPS)
              </label>
              <input
                type="text"
                required
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value.toUpperCase())}
                placeholder="E.G. SOFIA RAMIREZ"
                autoComplete="username"
                className="w-full glass-well rounded-2xl px-4 py-3.5 text-on-surface font-mono font-bold text-sm uppercase tracking-wider placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                  2. Card PIN (3-Digit CVV) or Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowCvvHelp(!showCvvHelp)}
                  className="text-[11px] font-mono text-primary-container hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Where is my PIN?
                </button>
              </div>

              {showCvvHelp && (
                <div className="p-3 rounded-xl glass-well text-[11px] text-on-surface-variant space-y-1 border border-primary-container/30">
                  <p className="font-bold text-on-surface">How to find your temporary PIN:</p>
                  <p>
                    Flip your SmartPass credit card to the back. Your initial PIN is the{' '}
                    <span className="text-primary-container font-mono font-bold">3-digit CVV code</span>{' '}
                    next to the signature strip. Once logged in, you can change it to your own password!
                  </p>
                </div>
              )}

              <div className="relative">
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="•••"
                  autoComplete="current-password"
                  className="w-full glass-well rounded-2xl px-4 py-3.5 pr-11 text-on-surface font-mono font-bold text-base tracking-widest placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full liquid-button-primary py-3.5 rounded-2xl font-headline font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Access My SmartPass Account
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] font-mono text-on-surface-variant/70 z-10">
          Connected to ATM 4.0 Real-Time Classroom Ledger • Instant Auto-Updates Enabled
        </div>
      </div>
    );
  }

  const tier = getCreditTier(currentStudent.creditScore);
  const isDelisted = currentStudent.cardStatus === 'delisted';
  const daysInfo = activeLoan ? getDaysDifference(activeLoan.dueDate) : null;

  // ==================================================================
  // RENDER AUTHENTICATED STUDENT BANKING PORTAL
  // ==================================================================
  return (
    <div className="min-h-screen bg-background text-on-background pb-24 md:pb-12 relative overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 glass-panel rounded-2xl p-4 specular-edge shadow-2xl border border-primary-container/40 flex items-start gap-3">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-tertiary-fixed-dim shrink-0 mt-0.5" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary-container shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface">
              {toast.title}
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 glass-panel border-b border-outline-variant/20 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <StudentAvatar
              name={currentStudent.name}
              avatarUrl={currentStudent.avatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-headline font-bold text-on-surface truncate">
                  {currentStudent.name}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-container/15 text-primary-container border border-primary-container/30">
                  {tier.name} • {currentStudent.creditScore}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-tertiary-container" />
                <span>Available: E${availableBalance}.00</span>
                {reservedBalance > 0 && (
                  <span className="text-amber-400">(E${reservedBalance} held)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExitStudentWebMode && (
              <button
                type="button"
                onClick={onExitStudentWebMode}
                className="px-3 py-1.5 rounded-full glass-pill text-xs font-mono font-bold text-primary-container hover:border-primary-container/60"
              >
                {isEmbeddedPreview ? 'Exit Preview' : 'Teacher Hub'}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-full glass-pill text-on-surface hover:border-primary-container/50"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full glass-pill text-xs font-mono font-bold text-error hover:border-error/50 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* ============================================================== */}
        {/* OFFICIAL BANK BALANCE CHANGE DISCLAIMER BANNER / MODAL          */}
        {/* ============================================================== */}
        {unacknowledgedDisclaimers.length > 0 && (
          <div className="glass-panel rounded-3xl p-5 sm:p-6 border-2 border-amber-400/60 shadow-2xl space-y-4 specular-edge">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    Official Classroom Reserve Disclaimer
                  </span>
                  <h2 className="text-base sm:text-lg font-headline font-extrabold text-on-surface">
                    Notice of Account Balance Change ({unacknowledgedDisclaimers.length})
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleAcknowledgeDisclaimers(unacknowledgedDisclaimers.map((d) => d.id))
                }
                className="liquid-button-primary px-4 py-2 rounded-xl text-xs font-headline font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                I Understand &amp; Acknowledge All
              </button>
            </div>

            <div className="space-y-2.5">
              {unacknowledgedDisclaimers.map((disc: BalanceDisclaimerNotice) => {
                const isPositive = disc.delta >= 0;
                return (
                  <div
                    key={disc.id}
                    className="glass-well rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-outline-variant/25"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          }`}
                        >
                          {disc.category}
                        </span>
                        <span className="text-xs font-mono text-on-surface-variant">
                          {new Date(disc.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-headline font-bold text-on-surface">
                        {disc.reason}
                      </p>
                      <p className="text-xs font-mono text-on-surface-variant">
                        Previous Balance: E${disc.previousBalance}.00 →{' '}
                        <strong className="text-on-surface">
                          New Balance: E${disc.newBalance}.00
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span
                        className={`text-lg font-mono font-extrabold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+E$${disc.delta}.00` : `-E$${Math.abs(disc.delta)}.00`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeDisclaimers([disc.id])}
                        className="px-3 py-1.5 rounded-xl glass-pill text-xs font-mono font-bold text-on-surface hover:border-primary-container/50"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Store Skip Homework / Extra Points Configuration Popup Modal */}
        {configuringStoreItem && (
          <StoreRedemptionConfigModal
            item={configuringStoreItem.item}
            quantity={configuringStoreItem.targetQty}
            initialAllocations={cartAllocations[configuringStoreItem.item.id]}
            onClose={() => setConfiguringStoreItem(null)}
            onConfirm={(allocations, qty) => {
              setCart((prev) => ({
                ...prev,
                [configuringStoreItem.item.id]: qty,
              }));
              setCartAllocations((prev) => ({
                ...prev,
                [configuringStoreItem.item.id]: allocations,
              }));
              setConfiguringStoreItem(null);
              triggerToast(
                'success',
                'Added to Store Cart!',
                `${configuringStoreItem.item.name} configured (${formatStoreAllocationsSummary(
                  allocations
                )}).`
              );
            }}
          />
        )}

        {/* DESKTOP TAB BAR */}
        <div className="hidden md:flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl specular-edge">
          {[
            { id: 'wallet', label: 'My Wallet & Card', icon: CreditCard },
            {
              id: 'loans',
              label: activeLoan ? 'Pay Active Loan' : 'Open Loan',
              icon: BookOpen,
              badge: activeLoan ? `E$${remainingDebt}` : undefined,
            },
            {
              id: 'contracts',
              label: 'Contracts Wall',
              icon: ScrollText,
              badge:
                availableContracts.filter((c) => c.isActive && c.spotsRemaining > 0).length > 0
                  ? availableContracts.filter((c) => c.isActive && c.spotsRemaining > 0).length
                  : undefined,
            },
            {
              id: 'store',
              label: 'School Store',
              icon: ShoppingBag,
              badge: cartList.length > 0 ? cartList.length : undefined,
            },
            { id: 'transfer', label: 'Gift Postal Card', icon: Gift },
            { id: 'profile', label: 'My Profile & PIN', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudentTab)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary-fixed shadow-md'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/30 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MY WALLET & SMARTPASS CARD                              */}
        {/* ============================================================== */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 5 cols: 3D SmartPass Card */}
              <div className="lg:col-span-5 glass-panel rounded-3xl p-5 sm:p-6 specular-edge space-y-3">
                <CreditCardVisual student={currentStudent} settings={settings} interactive={true} />
                <button
                  type="button"
                  onClick={() => setIsPrintCardModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-headline font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-cyan-500/10"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  <span>Lost Card? Print Replacement Card</span>
                </button>
              </div>

              {/* Right 7 cols: Live Balance Telemetry & Quick Actions */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-panel rounded-3xl p-6 specular-edge space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="glass-well rounded-2xl p-4 border border-tertiary-container/30">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                        Available to Spend
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-tertiary-fixed-dim mt-1 block">
                        E$ {availableBalance}.00
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Total Wallet: E$ {currentStudent.currentBalance}.00
                      </span>
                    </div>

                    <div className="glass-well rounded-2xl p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                        Reserved (Pending)
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-amber-400 mt-1 block">
                        E$ {reservedBalance}.00
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Waiting Teacher Approval
                      </span>
                    </div>

                    <div className="glass-well rounded-2xl p-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                        FICO Credit Score
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-primary-container mt-1 block">
                        {currentStudent.creditScore} <span className="text-xs font-normal">/850</span>
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Max Loan: E$ {currentStudent.maxLoanLimit}
                      </span>
                    </div>
                  </div>

                  {/* Quick Navigation Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('loans')}
                      className="glass-well hover:border-primary-container/50 p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer border border-outline-variant/20"
                    >
                      <BookOpen className="w-5 h-5 text-primary-container" />
                      <span className="text-xs font-headline font-bold text-on-surface">
                        {activeLoan ? 'Pay My Loan' : 'Open Loan'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('contracts')}
                      className="glass-well hover:border-amber-400/50 p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer border border-outline-variant/20"
                    >
                      <ScrollText className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-headline font-bold text-on-surface">
                        Contracts Wall
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('store')}
                      className="glass-well hover:border-tertiary-container/50 p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer border border-outline-variant/20"
                    >
                      <ShoppingBag className="w-5 h-5 text-tertiary-fixed-dim" />
                      <span className="text-xs font-headline font-bold text-on-surface">
                        School Store
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('transfer')}
                      className="glass-well hover:border-primary-container/50 p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer border border-outline-variant/20"
                    >
                      <Gift className="w-5 h-5 text-pink-400" />
                      <span className="text-xs font-headline font-bold text-on-surface">
                        Gift Card E$
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrintCardModalOpen(true)}
                      className="glass-well hover:border-cyan-400/50 p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer border border-outline-variant/20"
                    >
                      <Printer className="w-5 h-5 text-cyan-400" />
                      <span className="text-xs font-headline font-bold text-on-surface">
                        Print Card
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="glass-well hover:border-primary-container/50 p-3 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer border border-outline-variant/20"
                    >
                      <User className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-headline font-bold text-on-surface">
                        Avatar &amp; PIN
                      </span>
                    </button>
                  </div>
                </div>

                {/* Pending Requests Queue for this Student */}
                {myPendingRequests.length > 0 && (
                  <div className="glass-panel rounded-3xl p-5 specular-edge space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      My Requests Status (ATM 4.0 Teacher Approval)
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {myPendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-outline-variant/20"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  req.status === 'pending'
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : req.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                                }`}
                              >
                                {req.status}
                              </span>
                              <span className="text-xs font-headline font-bold text-on-surface truncate">
                                {req.type === 'loan_request' &&
                                  `Loan Request: E$${req.loanRequestData?.principal}`}
                                {req.type === 'loan_payment' &&
                                  `Notebook Loan Photo: E$${req.loanPaymentData?.totalCreditValue}`}
                                {req.type === 'contract_submission' &&
                                  `Contract Photo: "${req.contractSubmissionData?.contractTitle}" (+E$${req.contractSubmissionData?.rewardAmount})`}
                                {req.type === 'store_purchase' &&
                                  `Store Order (${req.storePurchaseData?.items.length} items): E$${req.storePurchaseData?.totalPrice}`}
                                {req.type === 'p2p_transfer' &&
                                  `Send E$${req.transferData?.amount} to ${req.transferData?.recipientName}`}
                              </span>
                            </div>
                            {req.type === 'store_purchase' &&
                              req.storePurchaseData?.items.some(
                                (it) => it.allocations && it.allocations.length > 0
                              ) && (
                                <div className="text-[11px] font-mono text-indigo-300">
                                  {req.storePurchaseData.items
                                    .filter((it) => it.allocations && it.allocations.length > 0)
                                    .map(
                                      (it) =>
                                        `${it.itemName}: ${formatStoreAllocationsSummary(
                                          it.allocations
                                        )}`
                                    )
                                    .join(' | ')}
                                </div>
                              )}
                            <p className="text-[11px] font-mono text-on-surface-variant">
                              {new Date(req.createdAt).toLocaleString()}
                              {req.teacherNote ? ` • "${req.teacherNote}"` : ''}
                            </p>
                          </div>

                          {req.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleCancelPendingRequest(req)}
                              className="px-2.5 py-1 rounded-xl glass-pill text-[11px] font-mono text-rose-400 hover:border-rose-400/50 shrink-0"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Account Ledger & Statement History */}
            <div className="glass-panel rounded-3xl p-6 specular-edge space-y-4">
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-container" />
                My Recent Transactions, Gift Postal Cards &amp; Passes
              </h3>

              <div className="space-y-2.5">
                {(currentStudent.p2pTransfersHistory || []).map((tx) => (
                  <div
                    key={tx.id}
                    className="glass-well rounded-2xl p-4 space-y-3 border border-pink-500/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.direction === 'received'
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                              🎁 Gift Postal Card: &ldquo;To you - from me&rdquo;
                            </span>
                            <span className="text-[11px] font-mono text-on-surface-variant">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs font-headline font-bold text-on-surface mt-1">
                            {tx.direction === 'received'
                              ? `From: ${tx.counterpartyName} → To: You (${currentStudent.name})`
                              : `From: You → To: ${tx.counterpartyName}`}
                          </p>
                          {tx.quickReply && (
                            <p className="text-xs font-mono text-emerald-300 mt-1">
                              💌 Reply: <strong>&ldquo;{tx.quickReply}&rdquo;</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-sm font-mono font-extrabold ${
                          tx.direction === 'received' ? 'text-emerald-400' : 'text-on-surface'
                        }`}
                      >
                        {tx.direction === 'received' ? `+E$${tx.amount}.00` : `-E$${tx.amount}.00`}
                      </span>
                    </div>

                    {/* 5 Quick Reply Options for Recipient */}
                    {tx.direction === 'received' && (
                      <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mr-1">
                          {tx.quickReply ? 'Change thank-you reply:' : 'Send a quick reply:'}
                        </span>
                        {QUICK_GIFT_REPLIES.map((replyOpt) => {
                          const isChosen = tx.quickReply === replyOpt;
                          return (
                            <button
                              key={replyOpt}
                              type="button"
                              onClick={() => handleReplyToPostalCard(tx, replyOpt)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-headline font-bold transition-all cursor-pointer ${
                                isChosen
                                  ? 'bg-emerald-500 text-slate-950 shadow'
                                  : 'glass-pill text-pink-200 hover:border-pink-400/50'
                              }`}
                            >
                              {isChosen ? `✓ ${replyOpt}` : replyOpt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {(currentStudent.storePurchasesHistory || []).map((purch) => (
                  <div
                    key={purch.id}
                    className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-headline font-bold text-on-surface">
                          Store Pass: {purch.itemName}
                        </p>
                        {purch.allocations && purch.allocations.length > 0 && (
                          <p className="text-[11px] font-mono text-indigo-300">
                            {formatStoreAllocationsSummary(purch.allocations)}
                          </p>
                        )}
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          Your request will be done asap - Teacher Anthony&apos;s ATM •{' '}
                          {new Date(purch.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-rose-400">
                      -E${purch.pricePaid}.00
                    </span>
                  </div>
                ))}

                {(currentStudent.englishRewardsHistory || []).map((rew) => (
                  <div
                    key={rew.id}
                    className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-headline font-bold text-on-surface">
                          English Grant: {rew.reason}
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          {new Date(rew.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">
                      +E${rew.amount}.00
                    </span>
                  </div>
                ))}

                {(currentStudent.balanceAdjustmentsHistory || []).map((adj) => (
                  <div
                    key={adj.id}
                    className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          adj.type === 'increase'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-headline font-bold text-on-surface">
                          {adj.reason}
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          Bank Adjustment ({adj.category || 'general'}) •{' '}
                          {new Date(adj.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-mono font-bold ${
                        adj.type === 'increase' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {adj.type === 'increase' ? `+E$${adj.amount}.00` : `-E$${adj.amount}.00`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: LOANS (INSTANT OPEN + 3 WAYS OF PAYMENT + PHOTO UPLOAD) */}
        {/* ============================================================== */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            {activeLoan ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active Loan Status Card + 3 Ways of Payment Guide */}
                <div className="lg:col-span-5 glass-panel rounded-3xl p-6 specular-edge space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      Active Loan • Complete Work to Receive E${activeLoan.principal}
                    </span>
                    <span className="text-xs font-mono text-on-surface-variant">
                      ID: {activeLoan.id}
                    </span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-emerald-200 leading-relaxed">
                    💡 <strong>How You Get Your Money:</strong> Once you complete the English work below (via Notebook Photo here OR face-to-face with Teacher Anthony) and it is approved, <strong>E${activeLoan.principal}.00</strong> (plus any extra E$ you write) is deposited into your wallet immediately!
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase text-on-surface-variant block">
                      Remaining English Work Value Required
                    </span>
                    <span className="text-3xl font-mono font-extrabold text-amber-400">
                      E$ {remainingDebt}.00
                    </span>
                    <p className="text-xs font-mono text-on-surface-variant mt-1">
                      Total Work Required: E${activeLoan.totalDue}.00 (Loan Principal E${activeLoan.principal} +{' '}
                      {activeLoan.effectiveInterestRate}% Interest)
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span>Completed: E${activeLoan.amountRepaid}.00</span>
                      <span>
                        {Math.min(
                          100,
                          Math.round((activeLoan.amountRepaid / activeLoan.totalDue) * 100)
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-container to-tertiary-container transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((activeLoan.amountRepaid / activeLoan.totalDue) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {daysInfo && (
                    <div className="glass-well rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-xs font-mono text-on-surface-variant">Due Date</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          daysInfo.isOverdue ? 'text-rose-400' : 'text-tertiary-fixed-dim'
                        }`}
                      >
                        {new Date(activeLoan.dueDate).toLocaleDateString()} ({daysInfo.formatted})
                      </span>
                    </div>
                  )}

                  {/* NON-CHANGEABLE WAY OF PAYMENT STATUS CARD */}
                  <div className="glass-well rounded-2xl p-4 space-y-3 text-xs font-mono border-2 border-primary-container/40">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-primary-container uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Way of Payment (Non-Changeable):
                      </p>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-primary-container text-on-primary-fixed shadow-sm">
                        {currentRepaymentMethodLabel}
                      </span>
                    </div>

                    {activeLoan.repaymentMethod ? (
                      <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-on-surface">
                            Locked Requirement:
                          </span>
                          <span className="text-sm font-mono font-black text-amber-300">
                            {currentRequiredCount} {currentRepaymentMethodLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          Write <strong>{currentRequiredCount} {currentRepaymentMethodLabel}</strong> in your English notebook (E${currentRepaymentUnitValue}.00 ea = E${calculatedRepaymentCredit}.00 total work value).
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-on-surface-variant">
                          Choose your 1 non-changeable payment method for this active loan:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveRepaymentMethodChoice('sentences')}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              currentRepaymentMethod === 'sentences'
                                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                                : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase text-emerald-300 block">Sentences</span>
                            <span className="text-xs font-extrabold text-on-surface block mt-0.5">
                              {Math.ceil(remainingDebt / settings.sentenceValue)} Sentences
                            </span>
                            <span className="text-[10px] opacity-75">E${settings.sentenceValue} ea</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveRepaymentMethodChoice('words')}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              currentRepaymentMethod === 'words'
                                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                                : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase text-cyan-300 block">Vocab Words</span>
                            <span className="text-xs font-extrabold text-on-surface block mt-0.5">
                              {Math.ceil(remainingDebt / settings.wordValue)} Words
                            </span>
                            <span className="text-[10px] opacity-75">E${settings.wordValue} ea</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveRepaymentMethodChoice('phrasal_verbs')}
                            className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                              currentRepaymentMethod === 'phrasal_verbs'
                                ? 'bg-indigo-500/20 border-indigo-400 text-white shadow-md'
                                : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase text-indigo-300 block">Phrasal Verbs</span>
                            <span className="text-xs font-extrabold text-on-surface block mt-0.5">
                              {Math.ceil(remainingDebt / settings.phrasalVerbValue)} Verbs
                            </span>
                            <span className="text-[10px] opacity-75">E${settings.phrasalVerbValue} ea</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pay Loan with Notebook Photo Form */}
                <div className="lg:col-span-7 glass-panel rounded-3xl p-6 specular-edge space-y-5">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold">
                      Complete Loan &amp; Receive E${activeLoan.principal}.00
                    </span>
                    <h2 className="text-xl font-headline font-extrabold text-on-surface mt-0.5">
                      Submit Notebook Photo (or Present Face-to-Face)
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Snap a clear photo of your notebook showing your completed work for your chosen way of payment. Once approved, you get your loan money instantly!
                    </p>
                  </div>

                  <form onSubmit={handleSubmitNotebookPayment} className="space-y-5">
                    {/* Locked-in Task Card */}
                    <div className="glass-well rounded-2xl p-4 border border-primary-container/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-primary-container font-extrabold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Work to Show in Notebook Photo:
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-primary-container text-on-primary-fixed">
                          {currentRepaymentMethodLabel}
                        </span>
                      </div>
                      <div className="text-xl font-headline font-black text-on-surface">
                        Write <span className="text-amber-300 font-mono text-2xl font-black">{currentRequiredCount}</span> {currentRepaymentMethodLabel} in your English notebook
                      </div>
                      <p className="text-xs text-on-surface-variant font-mono">
                        Worth E${currentRepaymentUnitValue}.00 each • Total Credit: <strong className="text-emerald-400">E${calculatedRepaymentCredit}.00</strong> (Sufficient to clear your E${remainingDebt}.00 debt).
                      </p>
                    </div>

                    {/* Decorated presentation toggle */}
                    <label className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer border border-outline-variant/20">
                      <div>
                        <p className="text-xs font-headline font-bold text-on-surface">
                          My Notebook Has Decorated Presentation ✨
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          Awards +{settings.decoratedPresentationScoreBoost} FICO Credit Score bonus upon teacher verification
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={hasDecoratedNotebook}
                        onChange={(e) => setHasDecoratedNotebook(e.target.checked)}
                        className="w-5 h-5 accent-cyan-400 rounded"
                      />
                    </label>

                    {/* Notebook Photo Upload Box */}
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold block">
                        Upload or Take Photo of Your Notebook *
                      </label>
                      <input
                        ref={notebookFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleNotebookPhotoSelect}
                        className="hidden"
                      />

                      {notebookPhotoDataUrl ? (
                        <div className="space-y-2">
                          <div className="relative rounded-2xl overflow-hidden border-2 border-tertiary-container/50 bg-black/40 max-h-72 flex items-center justify-center">
                            <img
                              src={notebookPhotoDataUrl}
                              alt="Notebook work preview"
                              className="max-h-72 w-auto object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setNotebookPhotoDataUrl('')}
                              className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-mono flex items-center gap-1 hover:bg-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Retake Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => notebookFileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-primary-container/40 hover:border-primary-container rounded-2xl p-6 glass-well flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Camera className="w-8 h-8 text-primary-container" />
                          <span className="text-sm font-headline font-bold text-on-surface">
                            {isCompressingPhoto
                              ? 'Optimizing Notebook Photo...'
                              : 'Tap to Take Photo or Upload Notebook Image'}
                          </span>
                          <span className="text-xs font-mono text-on-surface-variant">
                            Make sure your {currentRequiredCount} {currentRepaymentMethodLabel.toLowerCase()} are clearly visible
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Optional note */}
                    <input
                      type="text"
                      value={notebookStudentNotes}
                      onChange={(e) => setNotebookStudentNotes(e.target.value)}
                      placeholder="Optional note for your teacher (e.g. 'Page 14 - Unit 5 vocabulary')"
                      className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />

                    {/* Summary & Submit */}
                    <div className="glass-well rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-primary-container/30">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-on-surface-variant block">
                          Calculated Notebook Work Value
                        </span>
                        <span className="text-2xl font-mono font-extrabold text-tertiary-fixed-dim">
                          E$ {calculatedRepaymentCredit}.00
                        </span>
                        {calculatedRepaymentCredit >= remainingDebt ? (
                          <span className="block text-[11px] font-mono text-emerald-400">
                            ✓ Covers loan! Once approved, you receive E$
                            {activeLoan.principal + Math.max(0, calculatedRepaymentCredit - remainingDebt)}.00 in your wallet!
                          </span>
                        ) : (
                          <span className="block text-[11px] font-mono text-amber-300">
                            Partial submission (E${remainingDebt - calculatedRepaymentCredit}.00 remaining before loan disburses)
                          </span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!notebookPhotoDataUrl || calculatedRepaymentCredit <= 0}
                        className="liquid-button-primary px-6 py-3.5 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                      >
                        Send Photo for Teacher Approval
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* NO ACTIVE LOAN -> OPEN A NEW LOAN IMMEDIATELY */
              <div className="max-w-3xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 specular-edge space-y-6">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold">
                    Instant Classroom Credit Line • Ceiling E${currentStudent.maxLoanLimit}
                  </span>
                  <h2 className="text-2xl font-headline font-extrabold text-on-surface mt-1">
                    Open a New Eurodollar Loan (No Initial Approval Needed!)
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Your loan opens immediately! Then complete one of the <strong>3 Ways of Payment</strong> in your notebook and send a photo (or show Teacher Anthony face-to-face) — once approved, you receive the money in your wallet!
                  </p>
                </div>

                <form onSubmit={handleSubmitLoanRequest} className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <label className="text-xs font-mono uppercase text-on-surface-variant font-bold">
                        Loan Amount You Want to Earn
                      </label>
                      <span className="text-2xl font-mono font-extrabold text-primary-container">
                        E$ {loanPrincipalInput}.00
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={Math.max(50, currentStudent.maxLoanLimit)}
                      step={5}
                      value={loanPrincipalInput}
                      onChange={(e) => setLoanPrincipalInput(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
                      <span>Min: E$10</span>
                      <span>Your Max Limit: E${currentStudent.maxLoanLimit}</span>
                    </div>
                  </div>

                  {/* CHOOSE FROM 3 WAYS OF PAYMENT (NON-CHANGEABLE) */}
                  {(() => {
                    const previewTotalDue = calculateTotalDue(
                      loanPrincipalInput,
                      settings.baseInterestRate
                    );
                    const reqPV = Math.ceil(previewTotalDue / settings.phrasalVerbValue);
                    const reqSent = Math.ceil(previewTotalDue / settings.sentenceValue);
                    const reqWords = Math.ceil(previewTotalDue / settings.wordValue);
                    return (
                      <div className="glass-well rounded-2xl p-4 space-y-3 border-2 border-primary-container/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-headline font-extrabold text-primary-container uppercase flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Choose Your Way of Payment (Non-Changeable):
                          </span>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">
                            🔒 Locked upon loan creation
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                          <button
                            type="button"
                            onClick={() => setSelectedRepaymentMethod('sentences')}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                              selectedRepaymentMethod === 'sentences'
                                ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/40'
                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-emerald-400/40'
                            }`}
                          >
                            <span className="text-[10px] text-emerald-300 font-bold uppercase block">
                              Way 1 • Sentences
                            </span>
                            <span className="text-lg font-black text-on-surface block mt-0.5">
                              {reqSent} Sentences
                            </span>
                            <span className="text-[10px] opacity-80 block mt-0.5">
                              E${settings.sentenceValue} ea • Covers E${reqSent * settings.sentenceValue}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedRepaymentMethod('words')}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                              selectedRepaymentMethod === 'words'
                                ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-400/40'
                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-cyan-400/40'
                            }`}
                          >
                            <span className="text-[10px] text-cyan-300 font-bold uppercase block">
                              Way 2 • Vocab Words
                            </span>
                            <span className="text-lg font-black text-on-surface block mt-0.5">
                              {reqWords} Words
                            </span>
                            <span className="text-[10px] opacity-80 block mt-0.5">
                              E${settings.wordValue} ea • Covers E${reqWords * settings.wordValue}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedRepaymentMethod('phrasal_verbs')}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                              selectedRepaymentMethod === 'phrasal_verbs'
                                ? 'bg-indigo-500/25 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400/40'
                                : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-indigo-400/40'
                            }`}
                          >
                            <span className="text-[10px] text-indigo-300 font-bold uppercase block">
                              Way 3 • Phrasal Verbs
                            </span>
                            <span className="text-lg font-black text-on-surface block mt-0.5">
                              {reqPV} Phrasal Verbs
                            </span>
                            <span className="text-[10px] opacity-80 block mt-0.5">
                              E${settings.phrasalVerbValue} ea • Covers E${reqPV * settings.phrasalVerbValue}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLoanTypeInput('short');
                        setLoanDurationInput(5);
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        loanTypeInput === 'short'
                          ? 'glass-panel border-primary-container'
                          : 'glass-well border-outline-variant/20'
                      }`}
                    >
                      <p className="text-xs font-headline font-bold text-on-surface">
                        Short Liquidity Advance (5 Days)
                      </p>
                      <p className="text-[11px] font-mono text-on-surface-variant mt-1">
                        Fast classroom advance • {settings.baseInterestRate}% base interest
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoanTypeInput('big');
                        setLoanDurationInput(14);
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                        loanTypeInput === 'big'
                          ? 'glass-panel border-primary-container'
                          : 'glass-well border-outline-variant/20'
                      }`}
                    >
                      <p className="text-xs font-headline font-bold text-on-surface">
                        Extended Term Loan (14 Days)
                      </p>
                      <p className="text-[11px] font-mono text-on-surface-variant mt-1">
                        2-week repayment window • {settings.baseInterestRate}% base interest
                      </p>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-on-surface-variant font-bold block">
                      Optional Note
                    </label>
                    <input
                      type="text"
                      value={loanNotesInput}
                      onChange={(e) => setLoanNotesInput(e.target.value)}
                      placeholder="e.g. Saving up for Extra Points privilege in the Store"
                      className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>

                  <div className="glass-well rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-on-surface-variant block">
                        Total English Work Required ({settings.baseInterestRate}% Interest)
                      </span>
                      <span className="text-xl font-mono font-extrabold text-amber-400">
                        E$ {calculateTotalDue(loanPrincipalInput, settings.baseInterestRate)}.00
                      </span>
                    </div>
                    <button
                      type="submit"
                      className="liquid-button-primary px-6 py-3.5 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Open Loan Now &amp; Start Notebook Work
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Past Loans History */}
            {studentLoansHistory.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 specular-edge space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                  My Loan History ({studentLoansHistory.length})
                </h3>
                <div className="space-y-2">
                  {studentLoansHistory.map((ln) => (
                    <div
                      key={ln.id}
                      className="glass-well rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-headline font-bold text-on-surface">
                          {ln.loanType === 'short' ? 'Short Advance' : 'Extended Loan'} • Principal E$
                          {ln.principal} (Total Work E${ln.totalDue})
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant">
                          Created {new Date(ln.createdAt).toLocaleDateString()} • Completed: E$
                          {ln.amountRepaid}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                          ln.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-400/20 text-amber-300'
                        }`}
                      >
                        {ln.status === 'paid' ? 'Paid & Disbursed' : ln.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2B: CONTRACTS / EVENTS WALL (LIMITED STOCK NOTEBOOK TASKS) */}
        {/* ============================================================== */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 specular-edge flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-500/30">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                  <ScrollText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Limited Stock Classroom Bounties
                  </span>
                  <h2 className="text-xl font-headline font-extrabold text-on-surface">
                    Teacher Anthony&apos;s Contracts &amp; Events Wall
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Take a contract to reserve 1 spot! Complete the instructions in your notebook and send a photo for approval to earn E$ rewards!
                  </p>
                </div>
              </div>
            </div>

            <input
              ref={contractFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleContractPhotoSelect}
              className="hidden"
            />

            {availableContracts.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center space-y-2">
                <ScrollText className="w-10 h-10 text-on-surface-variant mx-auto" />
                <p className="text-base font-headline font-bold text-on-surface">
                  No Contracts Posted Right Now
                </p>
                <p className="text-xs font-mono text-on-surface-variant">
                  Check back soon! When Teacher Anthony posts new limited-stock contracts, they will appear here live.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {availableContracts.map((contract) => {
                  const myClaim = contract.claims.find(
                    (cl) => cl.studentId === currentStudent.id
                  );
                  const isUploadingThis = activeContractUploadId === contract.id;

                  return (
                    <div
                      key={contract.id}
                      className="glass-panel rounded-3xl p-5 specular-edge flex flex-col justify-between gap-4 border border-outline-variant/25"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              contract.spotsRemaining > 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {contract.spotsRemaining > 0
                              ? `${contract.spotsRemaining} / ${contract.totalStock} Spots Available`
                              : `Sold Out (0 / ${contract.totalStock} Spots Left)`}
                          </span>

                          {contract.deadline && (
                            <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Due: {contract.deadline}
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-headline font-extrabold text-on-surface">
                            {contract.title}
                          </h3>
                          <div className="glass-well px-3 py-1.5 rounded-2xl text-right shrink-0 border border-emerald-500/30">
                            <span className="text-base font-mono font-extrabold text-emerald-400 block">
                              +E${contract.rewardAmount}
                            </span>
                            {contract.creditScoreBonus > 0 && (
                              <span className="text-[10px] font-mono text-amber-300 block">
                                +{contract.creditScoreBonus} Score
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="glass-well rounded-2xl p-3.5 text-xs text-on-surface whitespace-pre-line leading-relaxed">
                          {contract.instructions}
                        </div>
                      </div>

                      {/* Claim Status / Actions */}
                      <div className="pt-3 border-t border-outline-variant/20 space-y-3">
                        {!myClaim ? (
                          <button
                            type="button"
                            disabled={!contract.isActive || contract.spotsRemaining <= 0}
                            onClick={() => handleReserveContractSpot(contract)}
                            className="w-full liquid-button-primary py-3 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                          >
                            {contract.spotsRemaining <= 0
                              ? 'All Spots Taken by Classmates'
                              : `Take Contract (Reserve 1 of ${contract.spotsRemaining} Spots)`}
                          </button>
                        ) : myClaim.status === 'approved' ? (
                          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold flex items-center justify-between">
                            <span>✅ Contract Approved &amp; Paid (+E${contract.rewardAmount}.00)!</span>
                          </div>
                        ) : myClaim.status === 'pending_approval' ? (
                          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-mono flex items-center justify-between gap-2">
                            <span>📸 Notebook photo sent! Waiting for Teacher Anthony&apos;s approval.</span>
                            <button
                              type="button"
                              onClick={() => handleReleaseContractSpot(contract, myClaim)}
                              className="px-2.5 py-1 rounded-lg glass-pill text-rose-300 text-[10px] shrink-0"
                            >
                              Cancel &amp; Free Spot
                            </button>
                          </div>
                        ) : (
                          /* status is 'reserved' or 'rejected' */
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-bold text-cyan-300">
                                {myClaim.status === 'rejected'
                                  ? `❌ Teacher Feedback: "${myClaim.teacherFeedback || 'Please retry photo'}"`
                                  : '🔒 Spot Reserved for You! Complete in your notebook & upload photo:'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleReleaseContractSpot(contract, myClaim)}
                                className="px-2.5 py-1 rounded-xl glass-pill text-[10px] font-mono text-rose-300 flex items-center gap-1 shrink-0"
                              >
                                <RotateCcw className="w-3 h-3" /> Release Spot
                              </button>
                            </div>

                            {isUploadingThis && contractPhotoDataUrl ? (
                              <div className="space-y-2.5">
                                <div className="relative rounded-2xl overflow-hidden border border-amber-400/40 bg-black/50 max-h-56 flex items-center justify-center">
                                  <img
                                    src={contractPhotoDataUrl}
                                    alt="Contract Notebook Preview"
                                    className="max-h-56 w-auto object-contain"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setContractPhotoDataUrl('')}
                                    className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/80 text-white text-[10px] font-mono"
                                  >
                                    Retake
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={contractStudentNotes}
                                  onChange={(e) => setContractStudentNotes(e.target.value)}
                                  placeholder="Optional note for Teacher Anthony..."
                                  className="w-full glass-well rounded-xl px-3.5 py-2 text-xs font-mono text-on-surface"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSubmitContractPhoto(contract, myClaim)}
                                  className="w-full liquid-button-primary py-3 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider cursor-pointer"
                                >
                                  Submit Notebook Photo for +E${contract.rewardAmount}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (activeContractUploadId !== contract.id) {
                                    setContractPhotoDataUrl(null);
                                    setContractStudentNotes('');
                                  }
                                  setActiveContractUploadId(contract.id);
                                  contractFileInputRef.current?.click();
                                }}
                                className="w-full border-2 border-dashed border-amber-400/50 hover:border-amber-400 rounded-2xl p-4 glass-well flex items-center justify-center gap-2 text-xs font-headline font-bold text-amber-300 cursor-pointer"
                              >
                                <Camera className="w-4 h-4" />
                                Tap to Upload / Take Notebook Photo for This Contract
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SCHOOL STORE                                            */}
        {/* ============================================================== */}
        {activeTab === 'store' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Store Catalog */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass-panel rounded-3xl p-5 specular-edge flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-headline font-extrabold text-on-surface">
                    Classroom Privilege &amp; Prize Store
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Skip Homework &amp; Extra Points items will ask for the Homework/Lesson name and date. Once approved, you will get: &ldquo;Your request will be done asap - Teacher Anthony&apos;s ATM&rdquo;.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] uppercase text-on-surface-variant block">
                    Available to Spend
                  </span>
                  <span className="text-lg font-extrabold text-tertiary-fixed-dim">
                    E$ {availableBalance}.00
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableStoreItems.map((item) => {
                  const effectivePrice = calculateEffectiveItemPrice(item);
                  const outOfStock = !item.unlimitedStock && item.stock <= 0;
                  const reqInfo = getStoreRedemptionRequirement(item);
                  return (
                    <div
                      key={item.id}
                      className="glass-panel rounded-3xl p-4 specular-edge flex flex-col justify-between gap-3 border border-outline-variant/20"
                    >
                      <div className="space-y-3">
                        <StoreItemVisual item={item} />
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-headline font-bold text-on-surface">
                              {item.name}
                            </h3>
                            <span className="text-sm font-mono font-extrabold text-tertiary-fixed-dim shrink-0">
                              E${effectivePrice}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {reqInfo && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-400/30 text-[10px] font-mono text-indigo-300">
                              <Calendar className="w-3 h-3" />
                              {reqInfo.mode === 'skip'
                                ? `Requires ${reqInfo.targetLabel} Name & Date`
                                : `Choose 1 or Multiple ${reqInfo.targetLabel}s & Dates`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          {item.unlimitedStock ? 'Unlimited Stock' : `Stock: ${item.stock}`}
                        </span>
                        <button
                          type="button"
                          disabled={outOfStock}
                          onClick={() => handleAddToCart(item)}
                          className="liquid-button-primary px-3.5 py-1.5 rounded-xl text-xs font-headline font-bold disabled:opacity-40 cursor-pointer"
                        >
                          {outOfStock ? 'Sold Out' : '+ Buy / Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Checkout Cart */}
            <div className="lg:col-span-4 glass-panel rounded-3xl p-5 specular-edge space-y-4 sticky top-20">
              <h3 className="text-sm font-headline font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-tertiary-fixed-dim" />
                My Store Cart ({cartList.reduce((a, c) => a + c.quantity, 0)})
              </h3>

              {cartList.length === 0 ? (
                <p className="text-xs font-mono text-on-surface-variant py-8 text-center">
                  Your cart is empty. Tap &ldquo;+ Buy / Add&rdquo; on any store privilege!
                </p>
              ) : (
                <div className="space-y-3">
                  {cartList.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="glass-well rounded-2xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-headline font-bold text-on-surface truncate">
                            {entry.item.name}
                          </p>
                          <p className="text-[11px] font-mono text-tertiary-fixed-dim">
                            E${entry.unitPrice} × {entry.quantity} = E${entry.lineTotal}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(entry.item.id, -1)}
                            className="p-1.5 rounded-lg glass-pill"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-5 text-center">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(entry.item)}
                            className="p-1.5 rounded-lg glass-pill"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {entry.allocations && entry.allocations.length > 0 && (
                        <div className="pt-1.5 border-t border-outline-variant/15 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-indigo-300 font-bold">
                              Scheduled Lessons / HW:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setConfiguringStoreItem({
                                  item: entry.item,
                                  targetQty: entry.quantity,
                                })
                              }
                              className="text-[10px] font-mono text-cyan-300 underline"
                            >
                              Edit Details
                            </button>
                          </div>
                          {entry.allocations.map((a, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] font-mono text-on-surface-variant flex items-center justify-between"
                            >
                              <span className="truncate">
                                {a.pointsAllocated ? `+${a.pointsAllocated} pts: ` : 'Skip: '}
                                <strong className="text-on-surface">{a.targetName}</strong>
                              </span>
                              <span className="text-indigo-300 shrink-0 ml-2">{a.targetDate}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-3 border-t border-outline-variant/20 space-y-3">
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-xs text-on-surface-variant uppercase">Total Order</span>
                      <span className="text-xl font-extrabold text-tertiary-fixed-dim">
                        E$ {cartTotal}.00
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitStoreOrder}
                      disabled={cartTotal > availableBalance}
                      className="w-full liquid-button-primary py-3 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                    >
                      {cartTotal > availableBalance
                        ? 'Insufficient Available Balance'
                        : `Send Order for Teacher Approval (E$${cartTotal})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SEND MONEY TO FRIENDS (GIFT POSTAL CARD & QUICK REPLIES) */}
        {/* ============================================================== */}
        {activeTab === 'transfer' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 specular-edge space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400 font-bold">
                  Instant Peer-to-Peer Gift Postal Card • Safe &amp; Message-Free
                </span>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface mt-1 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-pink-400" />
                  Send a Gift Postal Card to a Friend
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Send Eurodollars as an official postal card saying <strong>&ldquo;To you - from me&rdquo;</strong> with a gift icon! Your friend receives it immediately and can reply with a thank-you button.
                </p>
              </div>

              <form onSubmit={handleSendP2PTransfer} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase text-on-surface-variant font-bold block">
                    1. Choose a Classmate ({eligibleClassmates.length} available)
                  </label>
                  <input
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Search friend by name..."
                    className="w-full glass-well rounded-2xl px-4 py-2.5 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {eligibleClassmates.map((friend) => {
                      const isSelected = recipientId === friend.id;
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => setRecipientId(friend.id)}
                          className={`p-3 rounded-2xl flex items-center gap-3 text-left border transition-all cursor-pointer ${
                            isSelected
                              ? 'glass-panel border-pink-400 shadow-md'
                              : 'glass-well border-outline-variant/15 hover:border-pink-400/40'
                          }`}
                        >
                          <StudentAvatar
                            name={friend.name}
                            avatarUrl={friend.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-headline font-bold text-on-surface truncate">
                              {friend.name}
                            </p>
                            <p className="text-[10px] font-mono text-on-surface-variant truncate">
                              {friend.className || 'Classmate'}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount + Postal Card Live Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
                  <div className="sm:col-span-5 space-y-1.5 flex flex-col justify-center">
                    <label className="text-xs font-mono uppercase text-on-surface-variant font-bold block">
                      2. Gift Amount (Max E${availableBalance})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, availableBalance)}
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full glass-well rounded-2xl px-4 py-3 text-lg font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                  </div>

                  {/* Postal Card Visual */}
                  <div className="sm:col-span-7 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/15 to-indigo-500/20 border-2 border-pink-400/40 p-4 flex items-center justify-between gap-4 shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-pink-500/25 border border-pink-400/50 flex items-center justify-center text-pink-300 shadow-inner shrink-0">
                        <Gift className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-pink-300 font-bold block">
                          Official ATM Gift Postal Card
                        </span>
                        <p className="text-base font-headline font-extrabold text-white">
                          &ldquo;To you - from me&rdquo;
                        </p>
                        <p className="text-[11px] font-mono text-pink-200/90 mt-0.5">
                          To: {students.find((s) => s.id === recipientId)?.name || 'Select a Friend'} • From: {currentStudent.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <span className="text-xl font-extrabold text-emerald-400">
                        E${transferAmount || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!recipientId || !transferAmount || Number(transferAmount) > availableBalance}
                  className="w-full liquid-button-primary py-3.5 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  Send Gift Postal Card &ldquo;To you - from me&rdquo; (E${transferAmount || 0})
                </button>
              </form>
            </div>

            {/* Received & Sent Postal Cards with Quick Reply Buttons */}
            {(currentStudent.p2pTransfersHistory || []).length > 0 && (
              <div className="glass-panel rounded-3xl p-6 specular-edge space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-2">
                  <Gift className="w-4 h-4 text-pink-400" />
                  My Gift Postal Cards &amp; Quick Replies
                </h3>
                <div className="space-y-3">
                  {(currentStudent.p2pTransfersHistory || []).map((tx) => (
                    <div
                      key={tx.id}
                      className="glass-well rounded-2xl p-4 space-y-3 border border-pink-400/25"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-300">
                            <Gift className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-headline font-extrabold text-on-surface">
                              🎁 &ldquo;To you - from me&rdquo; •{' '}
                              {tx.direction === 'received'
                                ? `From ${tx.counterpartyName}`
                                : `Sent to ${tx.counterpartyName}`}
                            </p>
                            <p className="text-[11px] font-mono text-on-surface-variant">
                              {new Date(tx.timestamp).toLocaleString()}
                            </p>
                            {tx.quickReply && (
                              <p className="text-xs font-mono text-emerald-300 mt-1">
                                💌 Quick Reply: <strong>&ldquo;{tx.quickReply}&rdquo;</strong>
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-base font-mono font-extrabold ${
                            tx.direction === 'received' ? 'text-emerald-400' : 'text-on-surface'
                          }`}
                        >
                          {tx.direction === 'received' ? `+E$${tx.amount}.00` : `-E$${tx.amount}.00`}
                        </span>
                      </div>

                      {tx.direction === 'received' && (
                        <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono uppercase text-on-surface-variant mr-1">
                            Tap to reply:
                          </span>
                          {QUICK_GIFT_REPLIES.map((replyOpt) => {
                            const isChosen = tx.quickReply === replyOpt;
                            return (
                              <button
                                key={replyOpt}
                                type="button"
                                onClick={() => handleReplyToPostalCard(tx, replyOpt)}
                                className={`px-3 py-1 rounded-full text-xs font-headline font-bold transition-all cursor-pointer ${
                                  isChosen
                                    ? 'bg-emerald-500 text-slate-950 shadow'
                                    : 'glass-pill text-pink-200 hover:border-pink-400/50'
                                }`}
                              >
                                {isChosen ? `✓ ${replyOpt}` : replyOpt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: MY PROFILE (AVATAR & OPTIONAL PASSWORD CHANGE)          */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Avatar Customizer */}
            <div className="lg:col-span-7 glass-panel rounded-3xl p-6 specular-edge space-y-5">
              <div className="flex items-center gap-4">
                <StudentAvatar
                  name={currentStudent.name}
                  avatarUrl={currentStudent.avatarUrl}
                  size="xl"
                />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold">
                    Personalize Your SmartPass
                  </span>
                  <h2 className="text-xl font-headline font-extrabold text-on-surface">
                    Profile Picture &amp; Holo Avatar
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Pick a 3D Holo Bank Avatar below or upload your own photo. It updates immediately on your teacher&apos;s ATM 4.0!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCustomAvatar}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="liquid-button-primary px-4 py-2.5 rounded-xl text-xs font-headline font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Upload My Own Photo
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintCardModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-headline font-bold flex items-center gap-2 cursor-pointer bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 transition-all"
                >
                  <Printer className="w-4 h-4 text-cyan-400" />
                  Print Replacement Card
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-on-surface-variant font-bold block">
                  Or Choose a Holo Bank Avatar:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {PRESET_BANK_AVATARS.map((av) => {
                    const isSelected = currentStudent.avatarUrl === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(av.id)}
                        className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                          isSelected
                            ? 'glass-panel border-primary-container scale-105 shadow-lg'
                            : 'glass-well border-outline-variant/20 hover:border-primary-container/40'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${av.gradient} border ${av.border} flex items-center justify-center text-2xl shadow-md`}
                        >
                          {av.emoji}
                        </div>
                        <span className="text-[11px] font-headline font-bold text-on-surface text-center">
                          {av.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Password / PIN Security */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 specular-edge space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-headline font-extrabold text-on-surface">
                    Password &amp; PIN Security
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {currentStudent.customPassword
                      ? 'You are using a custom password.'
                      : 'You are currently using your temporary 3-digit Card CVV PIN.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-on-surface-variant font-bold block">
                    Current PIN (CVV) or Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassVerify}
                    onChange={(e) => setCurrentPassVerify(e.target.value)}
                    placeholder="Enter current PIN/Password"
                    className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-on-surface-variant font-bold block">
                    New Custom Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Create a new password (min 3 chars)"
                    className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-on-surface-variant font-bold block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full glass-well rounded-2xl px-4 py-3 text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full liquid-button-primary py-3 rounded-2xl font-headline font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Save New Custom Password
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-outline-variant/25 px-1 py-1.5 flex items-center justify-around">
        {[
          { id: 'wallet', label: 'Wallet', icon: CreditCard },
          { id: 'loans', label: 'Loans', icon: BookOpen },
          { id: 'contracts', label: 'Contracts', icon: ScrollText },
          { id: 'store', label: 'Store', icon: ShoppingBag },
          { id: 'transfer', label: 'Gift Card', icon: Gift },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as StudentTab)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-headline font-bold transition-all ${
                isActive ? 'text-primary-container bg-primary-container/15' : 'text-on-surface-variant'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      {/* Student Card Replacement Print Modal */}
      {currentStudent && (
        <StudentCardPrintModal
          isOpen={isPrintCardModalOpen}
          onClose={() => setIsPrintCardModalOpen(false)}
          student={currentStudent}
          settings={settings}
        />
      )}
    </div>
  );
};
