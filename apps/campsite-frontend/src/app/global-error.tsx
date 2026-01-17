'use client';

import { useEffect } from 'react';

/**
 * Global Error Page
 * Handles fatal errors that prevent the root layout from rendering
 * This is a minimal page that doesn't rely on any components
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the critical error
    console.error('Critical application error:', error);

    // Future: Send to error tracking service
  }, [error]);

  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            padding: '32px',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Error Icon */}
          <div style={{ marginBottom: '24px' }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px',
            }}
          >
            เกิดข้อผิดพลาดร้ายแรง
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}
          >
            ขออภัย แอปพลิเคชันเกิดข้อผิดพลาดร้ายแรง
            กรุณารีเฟรชหน้าเว็บหรือลองใหม่ภายหลัง
          </p>

          {/* Error ID */}
          {error.digest && (
            <p
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '16px',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              ลองใหม่อีกครั้ง
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#16a34a',
                border: '1px solid #16a34a',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
