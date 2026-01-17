'use client';

import { OwnerRequestForm } from '@/components/auth/OwnerRequestForm';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Link from 'next/link';

export function BecomeOwnerContent() {
  return (
    <AuthGuard>
      <OwnerRequestForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          กลับไปหน้าหลัก
        </Link>
      </p>
    </AuthGuard>
  );
}
