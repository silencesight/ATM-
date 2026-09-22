import { Classroom } from '../types';

export const DEFAULT_CLASSROOMS: Classroom[] = [
  {
    id: 'class-1st-a',
    name: '1st BGU - Group A',
    gradeLevel: '1st BGU',
    section: 'A',
    description: 'First Year Baccalaureate - Morning Section A',
    color: 'emerald',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'class-1st-b',
    name: '1st BGU - Group B',
    gradeLevel: '1st BGU',
    section: 'B',
    description: 'First Year Baccalaureate - Morning Section B',
    color: 'cyan',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'class-2nd-a',
    name: '2nd BGU',
    gradeLevel: '2nd BGU',
    section: 'A',
    description: 'Second Year Baccalaureate - Advanced English',
    color: 'amber',
    createdAt: '2026-08-01T00:00:00Z',
  },
];

const STORAGE_KEY = 'english_academy_classrooms_v1';

export function loadClassrooms(): Classroom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLASSROOMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load classrooms from storage, using defaults', err);
  }
  return DEFAULT_CLASSROOMS;
}

export function saveClassrooms(classes: Classroom[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch (err) {
    console.warn('Failed to save classrooms to storage', err);
  }
}
