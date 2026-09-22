import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentPortal } from './components/StudentPortal';
import { PrintableCards } from './components/PrintableCards';
import { ClassroomStoreView } from './components/ClassroomStoreView';
import { SettingsModal } from './components/SettingsModal';
import {
  Student,
  Loan,
  TeacherSettings,
  EnglishSubmission,
  EnglishRewardTransaction,
  StoreItem,
  StorePurchaseTransaction,
  Classroom,
  BalanceAdjustmentTransaction,
  CreditLimitRaiseTransaction,
} from './types';
import { INITIAL_STUDENTS, INITIAL_LOANS } from './data/initialData';
import { loadClassrooms, saveClassrooms } from './data/classrooms';
import {
  DEFAULT_TEACHER_SETTINGS,
  calculateEffectiveInterest,
  calculateTotalDue,
  getCreditTier,
  getTodayDateString,
  CURRENCY_SYMBOL,
} from './utils/creditCalculator';
import { loadStoreCatalog, saveStoreCatalog, calculateEffectiveItemPrice } from './data/storeCatalog';
import { CheckCircle2, AlertTriangle, Sparkles, X, ShoppingBag } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Titlebar } from './components/Titlebar';

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

export default function App() {
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
      return saved ? JSON.parse(saved) : DEFAULT_TEACHER_SETTINGS;
    } catch {
      return DEFAULT_TEACHER_SETTINGS;
    }
  });

  const [currentView, setCurrentView] = useState<'teacher' | 'student' | 'print' | 'store'>('teacher');
  const [storeCatalog, setStoreCatalog] = useState<StoreItem[]>(() => loadStoreCatalog());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'std-1'
  );
  const [printTargetStudentId, setPrintTargetStudentId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => loadClassrooms());

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

  // Native Autosave
  useEffect(() => {
    // @ts-ignore
    if (window.__TAURI_INTERNALS__) {
      const payload = {
        exportDate: new Date().toISOString(),
        settings,
        students,
        loans,
        classrooms,
        storeCatalog,
      };
      
      const timeoutId = setTimeout(() => {
        import('@tauri-apps/api/core').then(({ invoke }) => {
          invoke('autosave_backup', { content: JSON.stringify(payload, null, 2) })
            .catch(e => console.error('Autosave failed:', e));
        });
      }, 2000); // 2 second debounce
      return () => clearTimeout(timeoutId);
    }
  }, [students, loans, settings, storeCatalog, classrooms]);

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
    const newTier = getCreditTier(newScore);

    // If purchase was tied to a catalog item with limited stock, decrement stock by 1
    if (storeDetails?.itemId) {
      setStoreCatalog((prevCatalog) =>
        prevCatalog.map((item) => {
          if (item.id !== storeDetails.itemId) return item;
          if (item.unlimitedStock) return item;
          return { ...item, stock: Math.max(0, item.stock - 1) };
        })
      );
    }

    const purchaseRecord: StorePurchaseTransaction = {
      id: `purch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      itemId: storeDetails?.itemId,
      itemName: storeDetails?.itemName || reason || 'Classroom Store Purchase',
      pricePaid: amountToDeduct,
      originalPrice: storeDetails?.originalPrice || amountToDeduct,
      discountPercent: storeDetails?.discountPercent || 0,
      creditScoreBonusAwarded: scoreBonus,
      timestamp: new Date().toISOString(),
    };

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentBalance: newBalance,
              creditScore: newScore,
              totalStorePurchasesCount: (s.totalStorePurchasesCount || 0) + 1,
              storePurchasesHistory: [purchaseRecord, ...(s.storePurchasesHistory || [])],
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

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              currentBalance: newBalance,
              creditScore: newScore,
              balanceAdjustmentsHistory: [adjustmentTx, ...(s.balanceAdjustmentsHistory || [])],
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

  // Issue new loan
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
    };

    setLoans((prev) => [newLoan, ...prev]);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, activeLoanId: loanId } : s))
    );

    addToast(
      'success',
      'Loan Issued',
      `Issued $${data.principal} loan (${data.loanType} loan, ${data.durationDays}d term) with 10% base interest.`
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

  // Submit English Work for repayment (or direct teacher in-class verification)
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

      // Update Loan
      setLoans((prev) =>
        prev.map((l) => {
          if (l.id !== submissionData.loanId) return l;
          return {
            ...l,
            amountRepaid: Math.min(newRepaid, l.totalDue),
            status: isFullyPaid ? 'paid' : 'active',
            paidAt: isFullyPaid ? new Date().toISOString() : undefined,
            submissions: [newSubmission, ...l.submissions],
          };
        })
      );

      // Update Student credit score, limits, and deposit excess money directly to account
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

          const updatedBalance = student.currentBalance + extraMoney;

          return {
            ...student,
            currentBalance: updatedBalance,
            creditScore: newScore,
            maxLoanLimit: newMaxLimit,
            activeLoanId: isFullyPaid ? null : student.activeLoanId,
            totalLoansCompleted: isFullyPaid ? student.totalLoansCompleted + 1 : student.totalLoansCompleted,
            punctualPaymentsCount: punctualCount,
            decoratedStatementsCount: decoratedCount,
          };
        })
      );

      const targetStudent = students.find((s) => s.id === loan.studentId);
      addToast(
        'success',
        isFullyPaid ? 'Loan Fully Settled!' : 'In-Class Statements Verified',
        extraMoney > 0
          ? `Loan settled! Extra $${extraMoney}.00 credited directly to ${targetStudent?.name || 'student'}'s account balance.`
          : `Credited $${submissionData.totalCreditValue} toward loan.${isFullyPaid ? ' Loan is completely settled!' : ''}`
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

    // Update Loan
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        return {
          ...l,
          amountRepaid: Math.min(newRepaid, l.totalDue),
          status: isFullyPaid ? 'paid' : 'active',
          paidAt: isFullyPaid ? new Date().toISOString() : undefined,
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

        const updatedBalance = student.currentBalance + extraMoney;

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
        };
      })
    );

    const targetStudent = students.find((s) => s.id === loan.studentId);
    addToast(
      'success',
      'English Submission Approved!',
      isFullyPaid
        ? extraMoney > 0
          ? `Loan settled! Extra $${extraMoney}.00 credited directly to ${targetStudent?.name || 'student'}'s account balance.`
          : `Loan fully settled! Credit score & loan limits increased.`
        : `$${submission.totalCreditValue} credited toward loan balance.`
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

  // Manually add daily English reward money to student (max $100 daily)
  const handleAddDailyEnglishReward = (
    studentId: string,
    amount: number,
    reason: string
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

    const rewardTransaction: EnglishRewardTransaction = {
      id: `rew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      amount,
      reason: reason.trim() || 'English classroom participation',
      createdAt: new Date().toISOString(),
    };

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          currentBalance: newBalance,
          dailyEnglishEarned: {
            date: todayStr,
            amount: newDailyTotal,
          },
          englishRewardsHistory: [rewardTransaction, ...(s.englishRewardsHistory || [])],
        };
      })
    );

    addToast(
      'success',
      'English Reward Added!',
      `+E$${amount}.00 awarded to ${student.name} (${rewardTransaction.reason}). Today's total: E$${newDailyTotal}.00.`
    );

    return { success: true };
  };

  // Export Data JSON
  const handleExportData = async () => {
    const payload = {
      exportDate: new Date().toISOString(),
      settings,
      students,
      loans,
    };
    const fileName = `english_classroom_credit_system_${new Date().toISOString().slice(0, 10)}.json`;
    const { triggerDownload } = await import('./utils/downloadHelper');
    await triggerDownload(fileName, JSON.stringify(payload, null, 2), 'json');
    addToast('success', 'Data Exported', 'Classroom JSON file downloaded.');
  };

  // Reset to initial sample data
  const handleResetData = () => {
    if (window.confirm('Reset all classroom data, loans, and credit scores to original sample values?')) {
      setStudents(INITIAL_STUDENTS);
      setLoans(INITIAL_LOANS);
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
      settings,
    };
    try {
      localStorage.setItem('esl_classroom_emergency_snapshot', JSON.stringify(payload));
      localStorage.setItem(`esl_snapshot_${Date.now()}`, JSON.stringify(payload));
      addToast('success', 'Snapshot Saved', `Emergency recovery snapshot saved at ${new Date().toLocaleTimeString()}.`);
    } catch {
      addToast('warning', 'Snapshot Notice', 'Local storage limit reached. Please use Download JSON backup.');
    }
  };

  // Active student object for student view
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const studentActiveLoan = loans.find(
    (l) => l.studentId === currentStudent?.id && (l.status === 'active' || l.status === 'pending_review')
  );

  // Add/Deduct money to multiple students
  const handleBulkBalanceAdjust = (
    studentIds: string[],
    amount: number,
    type: 'increase' | 'reduce',
    reason: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (studentIds.includes(s.id)) {
          const effectiveAmount = Math.abs(amount);
          const newBalance = type === 'increase'
            ? s.currentBalance + effectiveAmount
            : Math.max(0, s.currentBalance - effectiveAmount);
            
          const adjustmentTx: BalanceAdjustmentTransaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            amount: effectiveAmount,
            type,
            reason,
            timestamp: new Date().toISOString(),
          };

          return {
            ...s,
            currentBalance: newBalance,
            balanceAdjustmentsHistory: [adjustmentTx, ...(s.balanceAdjustmentsHistory || [])],
          };
        }
        return s;
      })
    );
    addToast(
      'success',
      'BULK TX SUCCESS',
      `${type === 'increase' ? 'Added' : 'Deducted'} E$${amount} for ${studentIds.length} student(s).`
    );
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased text-slate-100 flex flex-col relative ${
        currentView === 'teacher' ? 'bg-slate-950' : 'bg-[#0f172a]'
      }`}
    >
      <ErrorBoundary>
      <Titlebar />
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-sm w-full bg-slate-900 border shadow-2xl rounded-xl p-3 flex items-start gap-3 transform transition-all duration-300 animate-slide-up ${
              toast.type === 'success'
                ? 'border-emerald-500/30'
                : toast.type === 'warning'
                ? 'border-amber-500/30'
                : 'border-slate-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onChangeView={setCurrentView}
        students={students}
        selectedStudentId={selectedStudentId}
        onSelectStudent={setSelectedStudentId}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetData={handleResetData}
        onExportData={handleExportData}
        settings={settings}
      />

      {/* Main Views */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {currentView === 'teacher' && (
          <TeacherDashboard
            students={students}
            loans={loans}
            settings={settings}
            classrooms={classrooms}
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
            onBulkAdjustBalance={handleBulkBalanceAdjust}
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
            onOpenStore={() => setCurrentView('store')}
            onGrantCreditLimitRaise={handleGrantCreditLimitRaise}
            onRestoreBackup={handleRestoreBackup}
            onSaveManualSnapshot={handleSaveManualSnapshot}
          />
        )}

        {currentView === 'student' && currentStudent && (
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
            onPrintCard={(studentId) => {
              setPrintTargetStudentId(studentId);
              setCurrentView('print');
            }}
          />
        )}

        {currentView === 'store' && (
          <ClassroomStoreView
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            storeCatalog={storeCatalog}
            onUpdateCatalog={setStoreCatalog}
            onPurchaseItem={(studentId, amount, item, finalPrice) => {
              handleReduceStudentBalance(studentId, finalPrice, item.name, {
                itemId: item.id,
                itemName: item.name,
                originalPrice: item.basePrice,
                discountPercent: item.discountPercent,
              });
            }}
            onCustomDeduction={handleReduceStudentBalance}
            isTeacher={true}
          />
        )}

        {currentView === 'print' && (
          <PrintableCards
            students={students}
            settings={settings}
            initialSelectedStudentId={printTargetStudentId}
            onBack={() => {
              setPrintTargetStudentId(null);
              setCurrentView('teacher');
            }}
          />
        )}
      </main>

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
      </ErrorBoundary>
    </div>
  );
}
