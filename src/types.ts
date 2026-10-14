export type PaymentFrequency = 'monthly' | 'bimonthly';

export type CardStatus = 'active' | 'delisted';

export type LoanStatus = 'active' | 'pending_review' | 'paid' | 'defaulted';

export type LoanType = 'short' | 'big';

export interface EnglishSentenceItem {
  id: string;
  sentence: string;
}

export interface EnglishWordItem {
  id: string;
  word: string;
  contextOrMeaning: string;
}

export interface EnglishPhrasalVerbItem {
  id: string;
  verb: string;
  exampleInNotebook: string;
}

export interface EnglishSubmission {
  id: string;
  loanId: string;
  studentId: string;
  createdAt: string;
  sentencesCount?: number;
  wordsCount?: number;
  phrasalVerbsCount?: number;
  sentences: EnglishSentenceItem[];
  words: EnglishWordItem[];
  phrasalVerbs: EnglishPhrasalVerbItem[];
  sentencesCredit: number; // e.g. count * 25
  wordsCredit: number; // e.g. count * 5
  phrasalVerbsCredit: number; // e.g. count * 50
  totalCreditValue: number;
  hasDecoratedPresentation: boolean;
  scoreBonusAwarded: number; // e.g. +35 credit score
  status: 'pending' | 'approved' | 'rejected';
  teacherFeedback?: string;
  reviewedAt?: string;
}

export interface Loan {
  id: string;
  studentId: string;
  principal: number;
  baseInterestRate: number; // 10%
  delayPenaltyRate: number; // 2% per delay
  delaysCount: number;
  effectiveInterestRate: number; // base + delays * delayPenalty
  totalDue: number; // principal * (1 + effectiveInterestRate / 100)
  amountRepaid: number;
  loanType: LoanType;
  durationDays: number; // short: <= 5, big: <= 21
  createdAt: string;
  dueDate: string;
  status: LoanStatus;
  submissions: EnglishSubmission[];
  notes?: string;
  paidAt?: string;
}

export interface EnglishRewardTransaction {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  studentIdNumber: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardDesignTheme: 'emerald' | 'gold' | 'sapphire' | 'obsidian' | 'ruby';
  
  // Balances & Limits
  startingBalance: number; // $150
  currentBalance: number;  // account balance / wallet
  creditScore: number;     // e.g. 300 to 850
  maxLoanLimit: number;    // starts at $50, scales up to $1000
  
  // Payment schedule
  paymentFrequency: PaymentFrequency; // monthly ($482) or bimonthly ($241)
  
  // Card standing
  cardStatus: CardStatus; // active or delisted (declined forever)
  delistedReason?: string;
  delistedAt?: string;
  
  // Loans
  activeLoanId: string | null;
  totalLoansCompleted: number;
  
  // Punctuality & Presentation metrics
  punctualPaymentsCount: number;
  delaysCount: number;
  decoratedStatementsCount: number;

  // Daily English Dollars Rewards (manual teacher awards up to $100/day)
  dailyEnglishEarned?: {
    date: string; // YYYY-MM-DD
    amount: number;
  };
  englishRewardsHistory?: EnglishRewardTransaction[];
  storePurchasesHistory?: StorePurchaseTransaction[];
  totalStorePurchasesCount?: number;

  // Classroom grouping
  classId?: string;
  className?: string;

  // Manual balance adjustments history
  balanceAdjustmentsHistory?: BalanceAdjustmentTransaction[];

  // Credit limit raises history (manual teacher raises of choice)
  creditLimitRaisesHistory?: CreditLimitRaiseTransaction[];
}

export interface CreditLimitRaiseTransaction {
  id: string;
  studentId: string;
  studentName: string;
  previousLimit: number;
  newLimit: number;
  increaseAmount: number;
  reason: string;
  grantedBy: string;
  creditScoreBonus?: number;
  timestamp: string;
}

export interface Classroom {
  id: string;
  name: string;
  gradeLevel?: string;
  section?: string;
  description?: string;
  color: string; // e.g. emerald, cyan, amber, purple, blue, rose
  createdAt: string;
}

export interface BalanceAdjustmentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  type: 'increase' | 'decrease';
  amount: number;
  previousBalance: number;
  newBalance: number;
  reason: string;
  category?: 'reward' | 'correction' | 'fine' | 'contest' | 'activity' | 'store' | 'other';
  creditScoreChange?: number;
  timestamp: string;
}

export interface StoreItem {
  id: string;
  name: string;
  subtitle?: string;
  category: 'privilege' | 'academic' | 'prize' | 'game';
  basePrice: number;
  discountPercent: number; // 0 to 90
  stock: number;
  unlimitedStock?: boolean;
  iconType:
    | 'skip-hw'
    | 'skip-lesson'
    | 'extra-points-hw'
    | 'half-lesson'
    | 'lucky-draw'
    | 'super-mini-prize'
    | 'extra-points-lss'
    | 'mini-prize'
    | 'big-prize'
    | 'custom';
  description?: string;
  emoji?: string;
  isHidden?: boolean;
  isCustom?: boolean;
}

export interface StorePurchaseTransaction {
  id: string;
  studentId: string;
  studentName: string;
  itemId?: string;
  itemName: string;
  pricePaid: number;
  originalPrice: number;
  discountPercent: number;
  creditScoreBonusAwarded: number; // e.g. +5 pts
  timestamp: string;
}

export interface TeacherSettings {
  startingBalance: number; // $150
  monthlyPayment: number; // $482
  bimonthlyPayment: number; // $241 (per 2 weeks)
  baseInterestRate: number; // 10%
  delayPenaltyIncrement: number; // 2% per delay
  sentenceValue: number; // $25
  wordValue: number; // $5
  phrasalVerbValue: number; // $50
  startingLoanLimit: number; // $50
  maxLoanCap: number; // $1000
  punctualityScoreBoost: number; // +15
  decoratedPresentationScoreBoost: number; // +35
  lateDelayScorePenalty: number; // -25
  maxDailyEnglishDollars: number; // $100
  schoolName: string;
  classroomTitle: string;
}

export interface CreditTier {
  name: string;
  minScore: number;
  maxLoanLimit: number;
  badgeColor: string;
  badgeBg: string;
  cardLabel: string;
}
