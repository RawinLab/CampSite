#!/usr/bin/env ts-node
/**
 * Verification script for E2E test authentication setup
 *
 * This script checks that:
 * 1. Backend API is running and accessible
 * 2. Test users exist in the database
 * 3. Authentication flow works correctly
 * 4. Tokens are returned in the expected format
 *
 * Run with: npx ts-node tests/e2e/verify-auth-setup.ts
 */

import { TEST_USERS, API_BASE_URL, FRONTEND_URL } from './utils/auth';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

async function checkBackendHealth(): Promise<VerificationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      return {
        passed: true,
        message: '✅ Backend is running and healthy',
      };
    } else {
      return {
        passed: false,
        message: `❌ Backend returned status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: `❌ Cannot connect to backend at ${API_BASE_URL}`,
      details: (error as Error).message,
    };
  }
}

async function checkFrontendHealth(): Promise<VerificationResult> {
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok || response.status === 404) {
      // 404 is okay - it means the server is running
      return {
        passed: true,
        message: '✅ Frontend is running',
      };
    } else {
      return {
        passed: false,
        message: `❌ Frontend returned unexpected status ${response.status}`,
      };
    }
  } catch (error) {
    return {
      passed: false,
      message: `❌ Cannot connect to frontend at ${FRONTEND_URL}`,
      details: (error as Error).message,
    };
  }
}

async function checkTestUserLogin(
  role: keyof typeof TEST_USERS
): Promise<VerificationResult> {
  const user = TEST_USERS[role];

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        passed: false,
        message: `❌ Failed to login as ${role}`,
        details: error.error || error.message,
      };
    }

    const data = await response.json();

    // Verify response structure
    if (!data.session || !data.user) {
      return {
        passed: false,
        message: `❌ ${role} login response missing session or user`,
        details: data,
      };
    }

    // Verify tokens
    if (
      !data.session.access_token ||
      !data.session.refresh_token ||
      !data.session.expires_at
    ) {
      return {
        passed: false,
        message: `❌ ${role} login response missing required tokens`,
        details: {
          hasAccessToken: !!data.session.access_token,
          hasRefreshToken: !!data.session.refresh_token,
          hasExpiresAt: !!data.session.expires_at,
        },
      };
    }

    // Verify user role
    if (data.user.role !== user.role) {
      return {
        passed: false,
        message: `❌ ${role} user has incorrect role: ${data.user.role}`,
        details: data.user,
      };
    }

    return {
      passed: true,
      message: `✅ ${role} login successful with correct tokens`,
      details: {
        email: data.user.email,
        role: data.user.role,
        hasTokens: true,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ Error logging in as ${role}`,
      details: (error as Error).message,
    };
  }
}

async function checkTokenRefresh(): Promise<VerificationResult> {
  try {
    // First, login to get tokens
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USERS.user.email,
        password: TEST_USERS.user.password,
      }),
    });

    if (!loginResponse.ok) {
      return {
        passed: false,
        message: '❌ Cannot test token refresh - login failed',
      };
    }

    const loginData = await loginResponse.json();
    const refreshToken = loginData.session.refresh_token;

    // Try to refresh the token
    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshResponse.ok) {
      return {
        passed: false,
        message: '❌ Token refresh failed',
        details: await refreshResponse.json().catch(() => ({})),
      };
    }

    const refreshData = await refreshResponse.json();

    if (!refreshData.session || !refreshData.session.access_token) {
      return {
        passed: false,
        message: '❌ Token refresh response missing new tokens',
        details: refreshData,
      };
    }

    return {
      passed: true,
      message: '✅ Token refresh works correctly',
    };
  } catch (error) {
    return {
      passed: false,
      message: '❌ Error testing token refresh',
      details: (error as Error).message,
    };
  }
}

async function checkAuthMe(): Promise<VerificationResult> {
  try {
    // Login first to get access token
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USERS.user.email,
        password: TEST_USERS.user.password,
      }),
    });

    if (!loginResponse.ok) {
      return {
        passed: false,
        message: '❌ Cannot test /api/auth/me - login failed',
      };
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.session.access_token;

    // Call /api/auth/me
    const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      return {
        passed: false,
        message: '❌ /api/auth/me endpoint failed',
        details: await meResponse.json().catch(() => ({})),
      };
    }

    const meData = await meResponse.json();

    if (!meData.user || !meData.user.email) {
      return {
        passed: false,
        message: '❌ /api/auth/me response missing user data',
        details: meData,
      };
    }

    return {
      passed: true,
      message: '✅ /api/auth/me endpoint works correctly',
      details: {
        email: meData.user.email,
        role: meData.user.role,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: '❌ Error testing /api/auth/me',
      details: (error as Error).message,
    };
  }
}

async function runVerification() {
  console.log('🔍 E2E Test Authentication Setup Verification\n');
  console.log(`Backend URL: ${API_BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  // Check backend
  console.log('Checking backend...');
  results.push(await checkBackendHealth());

  // Check frontend
  console.log('Checking frontend...');
  results.push(await checkFrontendHealth());

  // Check test user logins
  console.log('\nChecking test user authentication...');
  results.push(await checkTestUserLogin('admin'));
  results.push(await checkTestUserLogin('owner'));
  results.push(await checkTestUserLogin('user'));

  // Check token refresh
  console.log('\nChecking token refresh...');
  results.push(await checkTokenRefresh());

  // Check /api/auth/me
  console.log('\nChecking /api/auth/me endpoint...');
  results.push(await checkAuthMe());

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(60) + '\n');

  results.forEach((result) => {
    console.log(result.message);
    if (result.details) {
      console.log('  Details:', JSON.stringify(result.details, null, 2));
    }
  });

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${passed}/${total} checks passed`);
  console.log('='.repeat(60) + '\n');

  if (allPassed) {
    console.log('✅ All verification checks passed!');
    console.log('   E2E tests should work correctly.\n');
    process.exit(0);
  } else {
    console.log('❌ Some verification checks failed.');
    console.log('   Please fix the issues before running E2E tests.\n');
    console.log('Common fixes:');
    console.log('  1. Start backend: cd apps/campsite-backend && pnpm dev');
    console.log('  2. Start frontend: cd apps/campsite-frontend && pnpm dev');
    console.log('  3. Seed test users: Run database seed script');
    console.log('  4. Check environment variables in .env files\n');
    process.exit(1);
  }
}

// Run verification
runVerification().catch((error) => {
  console.error('Fatal error during verification:', error);
  process.exit(1);
});
