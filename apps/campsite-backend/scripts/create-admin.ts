#!/usr/bin/env npx tsx
/**
 * Create Admin User Script
 * Usage: npx tsx scripts/create-admin.ts [email] [password]
 * Example: npx tsx scripts/create-admin.ts admin@campsite.com SecurePass123!
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  // Dynamic imports after env is loaded
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Get email and password from args or use defaults
  const email = process.argv[2] || 'admin@campsite.local';
  const password = process.argv[3] || 'Admin123!';
  const fullName = 'System Admin';

  console.log('🔧 Creating admin user...');
  console.log(`   Email: ${email}`);

  try {
    // Try to create user first - if it fails due to existing user, handle it
    let userId: string | null = null;
    let isNewUser = false;

    // Create new user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      // Check if user already exists
      if (createError.message.includes('already been registered')) {
        console.log('⚠️  User already exists, updating role to admin...');

        // Try to sign in with provided password to get user ID
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !signInData?.user) {
          // Try to find via raw SQL using rpc
          const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
            sql: `SELECT id FROM auth.users WHERE email = '${email}' LIMIT 1`
          });

          if (sqlError || !sqlResult?.[0]?.id) {
            console.log('⚠️  Could not find user. Try running with the correct existing password.');
            console.log('   Usage: npx tsx scripts/create-admin.ts <email> <existing-password>');
            console.log('\n   Alternatively, update the profile role manually in Supabase Dashboard:');
            console.log('   1. Go to Table Editor → profiles');
            console.log(`   2. Find the profile and set role = 'admin'`);
            process.exit(0);
          }

          userId = sqlResult[0].id;
        } else {
          userId = signInData.user.id;
          console.log('✅ Verified user credentials');
        }
      } else {
        throw createError;
      }
    } else if (authData?.user) {
      userId = authData.user.id;
      isNewUser = true;
      console.log(`✅ User created with ID: ${userId}`);
    } else {
      throw new Error('User creation returned no user data');
    }

    // Update profile to admin role (auth_user_id links to auth.users.id)
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'admin',
        full_name: fullName,
      })
      .eq('auth_user_id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('⚠️  Warning: Could not update profile role:', profileError.message);
      console.log('   You may need to manually set role to "admin" in the profiles table');
    } else {
      console.log('✅ Profile updated to admin role');
    }

    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${email}`);
    if (isNewUser) {
      console.log(`   Password: ${password}`);
      console.log('\n⚠️  Please change the password after first login!');
    } else {
      console.log(`   Password: (use existing password)`);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
