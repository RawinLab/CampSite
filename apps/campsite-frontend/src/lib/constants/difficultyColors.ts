import type { DifficultyLevel } from '@campsite/shared';
// DifficultyLevel is exported from campsite-detail.ts via shared/types

/**
 * Difficulty badge colors
 */
export const DIFFICULTY_COLORS: Record<DifficultyLevel, { bg: string; text: string; border: string }> = {
  easy: {
    bg: '#dcfce7',
    text: '#15803d',
    border: '#86efac',
  },
  moderate: {
    bg: '#fef3c7',
    text: '#b45309',
    border: '#fcd34d',
  },
  hard: {
    bg: '#fee2e2',
    text: '#dc2626',
    border: '#fca5a5',
  },
};

/**
 * Difficulty labels
 */
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
};

/**
 * Get Tailwind classes for difficulty badge
 */
export function getDifficultyClasses(difficulty: DifficultyLevel | null): string {
  if (!difficulty) return 'bg-gray-100 text-gray-600 border-gray-200';

  switch (difficulty) {
    case 'easy':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'moderate':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'hard':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}
