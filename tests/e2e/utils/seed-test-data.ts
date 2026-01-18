#!/usr/bin/env npx tsx
/**
 * Seed Test Data Script
 *
 * Creates test users and data for E2E tests.
 * Run before running E2E tests: npx tsx tests/e2e/utils/seed-test-data.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../apps/campsite-backend/.env') });

import { createClient } from '@supabase/supabase-js';

const TEST_USERS = {
  admin: {
    email: 'admin@campsite.local',
    password: 'Admin123!',
    role: 'admin',
    full_name: 'Test Admin',
  },
  owner: {
    email: 'owner@campsite.local',
    password: 'Owner123!',
    role: 'owner',
    full_name: 'Test Owner',
  },
  user: {
    email: 'user@campsite.local',
    password: 'User123!',
    role: 'user',
    full_name: 'Test User',
  },
};

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('🌱 Seeding test data...\n');

  // Create test users
  for (const [key, userData] of Object.entries(TEST_USERS)) {
    console.log(`Creating ${key} user: ${userData.email}`);

    try {
      // Check if user exists
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      let userId: string;

      if (signInData?.user) {
        userId = signInData.user.id;
        console.log(`  ⚠️  User already exists (ID: ${userId})`);
      } else {
        // Create new user
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: { full_name: userData.full_name },
        });

        if (createError) {
          if (createError.message.includes('already been registered')) {
            console.log(`  ⚠️  User already registered, skipping...`);
            continue;
          }
          throw createError;
        }

        userId = authData.user!.id;
        console.log(`  ✅ User created (ID: ${userId})`);
      }

      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: userData.role,
          full_name: userData.full_name,
        })
        .eq('auth_user_id', userId);

      if (profileError) {
        console.log(`  ⚠️  Could not update profile: ${profileError.message}`);
      } else {
        console.log(`  ✅ Profile updated to role: ${userData.role}`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n📋 Creating test data...\n');

  // Wait a bit for database consistency
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Get owner user ID by role
  const { data: ownerProfile, error: ownerError } = await supabase
    .from('profiles')
    .select('auth_user_id, full_name')
    .eq('role', 'owner')
    .limit(1)
    .single();

  if (!ownerProfile || ownerError) {
    console.error('❌ Could not find owner profile');
    console.error('Error:', ownerError);
    console.error('Checking all profiles...');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('full_name, auth_user_id, role')
      .limit(10);
    console.error('Profiles:', allProfiles);
    process.exit(1);
  }

  const ownerId = ownerProfile.auth_user_id;

  // Get first province
  const { data: provinces } = await supabase
    .from('provinces')
    .select('id, name_en')
    .limit(1);

  const provinceId = provinces?.[0]?.id;

  if (!provinceId) {
    console.log('⚠️  No provinces found, skipping campsite creation');
  } else {
    // Create test campsites
    const testCampsites = [
      {
        id: 'e2e-test-campsite-pending-1',
        name: 'E2E Test Campsite - Pending 1',
        description: 'Test campsite for E2E testing (pending approval)',
        status: 'pending',
        owner_id: ownerId,
        province_id: provinceId,
        campsite_type: 'camping',
        price_min: 500,
        price_max: 1500,
        latitude: 13.7563,
        longitude: 100.5018,
      },
      {
        id: 'e2e-test-campsite-pending-2',
        name: 'E2E Test Campsite - Pending 2',
        description: 'Another test campsite for E2E testing (pending)',
        status: 'pending',
        owner_id: ownerId,
        province_id: provinceId,
        campsite_type: 'glamping',
        price_min: 1000,
        price_max: 3000,
        latitude: 13.7563,
        longitude: 100.5018,
      },
      {
        id: 'e2e-test-campsite-approved-1',
        name: 'E2E Test Campsite - Approved',
        description: 'Approved test campsite for E2E testing',
        status: 'approved',
        owner_id: ownerId,
        province_id: provinceId,
        campsite_type: 'camping',
        price_min: 600,
        price_max: 1200,
        latitude: 13.7563,
        longitude: 100.5018,
      },
      {
        id: 'e2e-test-campsite-rejected-1',
        name: 'E2E Test Campsite - Rejected',
        description: 'Rejected test campsite for E2E testing',
        status: 'rejected',
        owner_id: ownerId,
        province_id: provinceId,
        campsite_type: 'tented-resort',
        price_min: 2000,
        price_max: 5000,
        latitude: 13.7563,
        longitude: 100.5018,
      },
    ];

    for (const campsite of testCampsites) {
      // Check if exists
      const { data: existing } = await supabase
        .from('campsites')
        .select('id')
        .eq('id', campsite.id)
        .single();

      if (existing) {
        console.log(`Campsite ${campsite.name} already exists, updating...`);
        await supabase.from('campsites').update(campsite).eq('id', campsite.id);
      } else {
        const { error } = await supabase.from('campsites').insert(campsite);
        if (error) {
          console.error(`❌ Failed to create campsite: ${error.message}`);
        } else {
          console.log(`✅ Created campsite: ${campsite.name}`);
        }
      }
    }
  }

  // Get user ID for reviews
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('auth_user_id')
    .eq('email', TEST_USERS.user.email)
    .single();

  if (userProfile && provinceId) {
    // Create test review on approved campsite
    const testReview = {
      id: 'e2e-test-review-1',
      campsite_id: 'e2e-test-campsite-approved-1',
      user_id: userProfile.auth_user_id,
      rating: 4,
      comment: 'Great place for camping! E2E test review.',
      status: 'visible',
    };

    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', testReview.id)
      .single();

    if (!existingReview) {
      const { error } = await supabase.from('reviews').insert(testReview);
      if (error) {
        console.error(`❌ Failed to create review: ${error.message}`);
      } else {
        console.log(`✅ Created test review`);
      }
    } else {
      console.log(`⚠️  Test review already exists`);
    }

    // Create reported review
    const reportedReview = {
      id: 'e2e-test-review-reported',
      campsite_id: 'e2e-test-campsite-approved-1',
      user_id: userProfile.auth_user_id,
      rating: 1,
      comment: 'This is a test review that will be reported',
      status: 'visible',
    };

    const { data: existingReported } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reportedReview.id)
      .single();

    if (!existingReported) {
      const { error: reviewError } = await supabase.from('reviews').insert(reportedReview);
      if (!reviewError) {
        console.log(`✅ Created reported review`);

        // Create report
        const report = {
          id: 'e2e-test-report-1',
          review_id: reportedReview.id,
          reporter_id: ownerId,
          reason: 'spam',
          description: 'E2E test report',
          status: 'pending',
        };

        await supabase.from('review_reports').upsert(report);
        console.log(`✅ Created review report`);
      }
    }
  }

  // Create owner request
  if (userProfile) {
    const ownerRequest = {
      id: 'e2e-test-owner-request-1',
      user_id: userProfile.auth_user_id,
      business_name: 'Test Business',
      reason: 'E2E test owner request',
      status: 'pending',
    };

    const { data: existingRequest } = await supabase
      .from('owner_requests')
      .select('id')
      .eq('id', ownerRequest.id)
      .single();

    if (!existingRequest) {
      const { error } = await supabase.from('owner_requests').insert(ownerRequest);
      if (error) {
        console.error(`❌ Failed to create owner request: ${error.message}`);
      } else {
        console.log(`✅ Created owner request`);
      }
    } else {
      console.log(`⚠️  Owner request already exists`);
    }
  }

  console.log('\n✅ Test data seeding complete!\n');
  console.log('Test user credentials:');
  for (const [key, userData] of Object.entries(TEST_USERS)) {
    console.log(`  ${key}: ${userData.email} / ${userData.password}`);
  }
}

main().catch(console.error);
