import { StoreItem } from '../types';

export const DEFAULT_STORE_ITEMS: StoreItem[] = [
  {
    id: 'store-skip-hw',
    name: 'Skip Homework',
    subtitle: 'Homework Privilege',
    category: 'privilege',
    basePrice: 1200,
    discountPercent: 0,
    stock: 2,
    iconType: 'skip-hw',
    description: 'Waives one standard English homework assignment without penalty.',
  },
  {
    id: 'store-skip-lesson',
    name: 'Skip Lesson',
    subtitle: 'Classroom Privilege',
    category: 'privilege',
    basePrice: 3200,
    discountPercent: 0,
    stock: 3,
    iconType: 'skip-lesson',
    description: 'Excuses attendance or active participation for one English period.',
  },
  {
    id: 'store-extra-points-hw',
    name: '3 Extra Points (HW)',
    subtitle: 'Academic Boost',
    category: 'academic',
    basePrice: 2200,
    discountPercent: 0,
    stock: 5,
    iconType: 'extra-points-hw',
    description: '+3 bonus points added directly to your English homework grade.',
  },
  {
    id: 'store-half-lesson',
    name: 'Half Lesson',
    subtitle: 'Classroom Privilege',
    category: 'privilege',
    basePrice: 3200,
    discountPercent: 0,
    stock: 5,
    iconType: 'half-lesson',
    description: 'Leave half-lesson early or sit out for the second half of class.',
  },
  {
    id: 'store-lucky-draw',
    name: 'A spin of the Lucky Draw',
    subtitle: 'Mystery Wheel',
    category: 'game',
    basePrice: 10500,
    discountPercent: 0,
    stock: 1,
    iconType: 'lucky-draw',
    description: 'One spin of the classroom prize wheel for legendary rewards.',
  },
  {
    id: 'store-super-mini-prize',
    name: 'Super-mini Prize',
    subtitle: 'Collectible Reward',
    category: 'prize',
    basePrice: 1500,
    discountPercent: 0,
    stock: 5,
    iconType: 'super-mini-prize',
    description: 'Mini novelty toy, stationery, stickers, or classroom sweet treat.',
  },
  {
    id: 'store-extra-points-lss',
    name: '3 Extra Points (Lss)',
    subtitle: 'Academic Boost',
    category: 'academic',
    basePrice: 4200,
    discountPercent: 0,
    stock: 5,
    iconType: 'extra-points-lss',
    description: '+3 bonus points added directly to your active Lesson / Exam evaluation.',
  },
  {
    id: 'store-mini-prize',
    name: 'Mini Prize',
    subtitle: 'Mystery Box',
    category: 'prize',
    basePrice: 5000,
    discountPercent: 0,
    stock: 5,
    iconType: 'mini-prize',
    description: 'Mystery black dice reward box with curated school rewards.',
  },
  {
    id: 'store-big-prize',
    name: 'Big Prize',
    subtitle: 'Grand Reward Box',
    category: 'prize',
    basePrice: 25000,
    discountPercent: 0,
    stock: 1,
    iconType: 'big-prize',
    description: 'Ultimate classroom grand prize mystery box for top savers.',
  },
];

const STORE_STORAGE_KEY = 'esl_classroom_store_items_v2';

export function loadStoreCatalog(): StoreItem[] {
  try {
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    if (!raw) return DEFAULT_STORE_ITEMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_STORE_ITEMS;
}

export function saveStoreCatalog(items: StoreItem[]): void {
  try {
    localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save store catalog', err);
  }
}

export function calculateEffectiveItemPrice(item: StoreItem): number {
  if (item.discountPercent <= 0) return item.basePrice;
  const discountMultiplier = Math.max(0, 1 - item.discountPercent / 100);
  return Math.max(0, Math.round(item.basePrice * discountMultiplier));
}
