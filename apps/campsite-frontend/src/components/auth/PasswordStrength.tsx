'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthCheck {
  label: string;
  test: (password: string) => boolean;
}

const strengthChecks: StrengthCheck[] = [
  { label: 'อย่างน้อย 8 ตัวอักษร', test: (p) => p.length >= 8 },
  { label: 'มีตัวพิมพ์ใหญ่', test: (p) => /[A-Z]/.test(p) },
  { label: 'มีตัวเลข', test: (p) => /[0-9]/.test(p) },
  { label: 'มีอักขระพิเศษ', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const results = useMemo(() => {
    return strengthChecks.map((check) => ({
      ...check,
      passed: check.test(password),
    }));
  }, [password]);

  const passedCount = results.filter((r) => r.passed).length;

  const strengthLevel = useMemo(() => {
    if (passedCount === 0) return { label: '', color: 'bg-gray-200' };
    if (passedCount === 1) return { label: 'อ่อน', color: 'bg-red-500' };
    if (passedCount === 2) return { label: 'พอใช้', color: 'bg-orange-500' };
    if (passedCount === 3) return { label: 'ดี', color: 'bg-yellow-500' };
    return { label: 'แข็งแกร่ง', color: 'bg-green-500' };
  }, [passedCount]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                passedCount >= level ? strengthLevel.color : 'bg-gray-200'
              )}
            />
          ))}
        </div>
        {strengthLevel.label && (
          <p className="text-sm text-muted-foreground">
            ความแข็งแกร่ง: <span className="font-medium">{strengthLevel.label}</span>
          </p>
        )}
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1 text-sm">
        {results.map((result, index) => (
          <li
            key={index}
            className={cn(
              'flex items-center gap-2 transition-colors',
              result.passed ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            <span className="flex-shrink-0">
              {result.passed ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </span>
            {result.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function isPasswordStrong(password: string): boolean {
  // Check minimum requirements: 8+ chars, uppercase, number
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
