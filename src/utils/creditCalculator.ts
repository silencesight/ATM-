import { CreditTier, TeacherSettings } from '../types';

export const DEFAULT_TEACHER_SETTINGS: TeacherSettings = {
  startingBalance: 150,
  monthlyPayment: 482,
  bimonthlyPayment: 241,
  baseInterestRate: 10, // 10%
  delayPenaltyIncrement: 2, // +2% per delay
  sentenceValue: 25, // $25 per sentence
  wordValue: 5, // $5 per word in book
  phrasalVerbValue: 50, // $50 per phrasal verb
  startingLoanLimit: 50, // starts at $50
  maxLoanCap: 1000, // up to $1000
  punctualityScoreBoost: 15,
  decoratedPresentationScoreBoost: 35,
  lateDelayScorePenalty: 25,
  maxDailyEnglishDollars: 100,
  schoolName: 'Oxford English Academy',
  classroomTitle: 'ESL Financial Literacy Project',
};

export const CREDIT_TIERS: CreditTier[] = [
  {
    name: 'Novice Learner',
    minScore: 300,
    maxLoanLimit: 50,
    badgeColor: 'text-amber-300',
    badgeBg: 'bg-amber-950/70 border-amber-500/40',
    cardLabel: 'CLASSIC STANDARD',
  },
  {
    name: 'Bronze Scholar',
    minScore: 560,
    maxLoanLimit: 150,
    badgeColor: 'text-orange-300',
    badgeBg: 'bg-orange-950/70 border-orange-500/40',
    cardLabel: 'BRONZE PREMIER',
  },
  {
    name: 'Silver Grammarian',
    minScore: 630,
    maxLoanLimit: 300,
    badgeColor: 'text-slate-200',
    badgeBg: 'bg-slate-800/80 border-slate-400/40',
    cardLabel: 'SILVER ADVANTAGE',
  },
  {
    name: 'Gold Linguist',
    minScore: 700,
    maxLoanLimit: 600,
    badgeColor: 'text-yellow-300',
    badgeBg: 'bg-yellow-950/70 border-yellow-500/50',
    cardLabel: 'GOLD ELITE',
  },
  {
    name: 'Platinum Master',
    minScore: 760,
    maxLoanLimit: 850,
    badgeColor: 'text-teal-300',
    badgeBg: 'bg-teal-950/70 border-teal-500/50',
    cardLabel: 'PLATINUM HONORS',
  },
  {
    name: 'Diamond Polyglot',
    minScore: 810,
    maxLoanLimit: 1000,
    badgeColor: 'text-cyan-200',
    badgeBg: 'bg-cyan-950/70 border-cyan-400/50',
    cardLabel: 'DIAMOND BLACK RESERVE',
  },
];

export function getCreditTier(score: number): CreditTier {
  const sorted = [...CREDIT_TIERS].sort((a, b) => b.minScore - a.minScore);
  for (const tier of sorted) {
    if (score >= tier.minScore) {
      return tier;
    }
  }
  return CREDIT_TIERS[0];
}

/**
 * Calculates effective interest rate: base rate + (delays * delay increment)
 */
export function calculateEffectiveInterest(
  delaysCount: number,
  settings: TeacherSettings = DEFAULT_TEACHER_SETTINGS
): number {
  return settings.baseInterestRate + delaysCount * settings.delayPenaltyIncrement;
}

/**
 * Calculates total due for a loan: principal * (1 + rate / 100)
 */
export function calculateTotalDue(
  principal: number,
  effectiveRate: number
): number {
  return Math.round(principal * (1 + effectiveRate / 100) * 100) / 100;
}

/**
 * Calculates value of English tasks submitted
 */
export function calculateEnglishRepaymentValue(
  sentencesCount: number,
  wordsCount: number,
  phrasalVerbsCount: number,
  settings: TeacherSettings = DEFAULT_TEACHER_SETTINGS
): {
  sentencesValue: number;
  wordsValue: number;
  phrasalVerbsValue: number;
  totalValue: number;
} {
  const sentencesValue = sentencesCount * settings.sentenceValue;
  const wordsValue = wordsCount * settings.wordValue;
  const phrasalVerbsValue = phrasalVerbsCount * settings.phrasalVerbValue;
  const totalValue = sentencesValue + wordsValue + phrasalVerbsValue;

  return {
    sentencesValue,
    wordsValue,
    phrasalVerbsValue,
    totalValue,
  };
}

/**
 * Helper to compute task breakdown combinations to cover an amount
 */
export function suggestTaskCombinations(
  amountDue: number,
  settings: TeacherSettings = DEFAULT_TEACHER_SETTINGS
): {
  pureSentences: number;
  purePhrasalVerbs: number;
  pureWords: number;
  balancedCombo: { phrasalVerbs: number; sentences: number; words: number };
} {
  const pureSentences = Math.ceil(amountDue / settings.sentenceValue);
  const purePhrasalVerbs = Math.ceil(amountDue / settings.phrasalVerbValue);
  const pureWords = Math.ceil(amountDue / settings.wordValue);

  // Balanced combo: 1 or 2 phrasal verbs first, then sentences, then words
  let rem = amountDue;
  const phrasalVerbs = Math.min(Math.floor(rem / settings.phrasalVerbValue), 2);
  rem -= phrasalVerbs * settings.phrasalVerbValue;

  const sentences = Math.floor(rem / settings.sentenceValue);
  rem -= sentences * settings.sentenceValue;

  const words = Math.ceil(Math.max(0, rem) / settings.wordValue);

  return {
    pureSentences,
    purePhrasalVerbs,
    pureWords,
    balancedCombo: { phrasalVerbs, sentences, words },
  };
}

export const CURRENCY_SYMBOL = 'E$';
export const CURRENCY_NAME = 'Eurodollars';
export const CURRENCY_NICKNAME = 'Eddies';

export function formatCurrency(amount: number, options?: { showDecimal?: boolean }): string {
  const validAmount = Number.isFinite(amount) ? amount : 0;
  const isWhole = Number.isInteger(validAmount);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options?.showDecimal ? 2 : (isWhole ? 0 : 2),
    maximumFractionDigits: 2,
  }).format(validAmount);
  return `E$ ${formattedNumber}`;
}

export function formatEurodollars(amount: number): string {
  return formatCurrency(amount);
}

export function formatCardNumber(raw: string): string {
  const cleaned = raw.replace(/\s+/g, '');
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
}

export function getDaysDifference(targetDate: string): {
  days: number;
  isOverdue: boolean;
  formatted: string;
} {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      isOverdue: true,
      formatted: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} OVERDUE`,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      formatted: 'Due today!',
    };
  } else {
    return {
      days: diffDays,
      isOverdue: false,
      formatted: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`,
    };
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStudentDailyEnglishDollars(
  student: { dailyEnglishEarned?: { date: string; amount: number } },
  maxDaily = 100,
  dateStr = getTodayDateString()
): { earnedToday: number; remainingToday: number; maxDaily: number } {
  const earnedToday =
    student.dailyEnglishEarned && student.dailyEnglishEarned.date === dateStr
      ? student.dailyEnglishEarned.amount
      : 0;
  const remainingToday = Math.max(0, maxDaily - earnedToday);
  return { earnedToday, remainingToday, maxDaily };
}
