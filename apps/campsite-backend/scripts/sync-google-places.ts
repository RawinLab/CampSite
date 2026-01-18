#!/usr/bin/env tsx
/**
 * CLI Script: Sync Google Places
 *
 * Usage:
 *   pnpm tsx scripts/sync-google-places.ts [options]
 *
 * Options:
 *   --type <full|incremental>  Sync type (default: incremental)
 *   --max-places <number>      Maximum places to sync (default: 100)
 *   --provinces <slugs>        Comma-separated province slugs (optional)
 *   --no-photos                Skip photo download
 *   --no-reviews               Skip review fetch
 *   --help                     Show help
 *
 * Examples:
 *   pnpm tsx scripts/sync-google-places.ts --type incremental --max-places 50
 *   pnpm tsx scripts/sync-google-places.ts --type full --provinces chiang-mai,chiang-rai
 *   pnpm tsx scripts/sync-google-places.ts --max-places 10 --no-photos
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import googlePlacesSyncService from '../src/services/google-places/sync.service';
import { supabaseAdmin } from '../src/lib/supabase';
import type { SyncConfig } from '@campsite/shared';

// Parse command line arguments
function parseArgs(): SyncConfig & { help?: boolean } {
  const args = process.argv.slice(2);
  const config: SyncConfig & { help?: boolean } = {
    type: 'incremental',
    maxPlaces: 100,
    downloadPhotos: true,
    fetchReviews: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        config.help = true;
        break;
      case '--type':
      case '-t':
        const typeVal = args[++i];
        if (typeVal === 'full' || typeVal === 'incremental') {
          config.type = typeVal;
        } else {
          console.error(`Invalid type: ${typeVal}. Must be 'full' or 'incremental'`);
          process.exit(1);
        }
        break;
      case '--max-places':
      case '-m':
        config.maxPlaces = parseInt(args[++i], 10);
        if (isNaN(config.maxPlaces) || config.maxPlaces <= 0) {
          console.error('Invalid max-places value. Must be a positive number.');
          process.exit(1);
        }
        break;
      case '--provinces':
      case '-p':
        config.provinces = args[++i].split(',').map(s => s.trim());
        break;
      case '--no-photos':
        config.downloadPhotos = false;
        break;
      case '--no-reviews':
        config.fetchReviews = false;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return config;
}

function showHelp(): void {
  console.log(`
Google Places Sync CLI

Usage:
  pnpm tsx scripts/sync-google-places.ts [options]

Options:
  --type, -t <full|incremental>  Sync type (default: incremental)
                                  - full: Sync all provinces from scratch
                                  - incremental: Only sync new/updated places
  --max-places, -m <number>      Maximum places to sync (default: 100)
  --provinces, -p <slugs>        Comma-separated province slugs (optional)
                                  e.g., chiang-mai,chiang-rai,phuket
  --no-photos                    Skip photo download
  --no-reviews                   Skip review fetch
  --help, -h                     Show this help message

Examples:
  # Basic incremental sync with 50 places max
  pnpm tsx scripts/sync-google-places.ts --max-places 50

  # Full sync for specific provinces
  pnpm tsx scripts/sync-google-places.ts --type full --provinces chiang-mai,chiang-rai

  # Quick sync without photos and reviews
  pnpm tsx scripts/sync-google-places.ts --max-places 10 --no-photos --no-reviews

Environment Variables Required:
  GOOGLE_PLACES_API_KEY    Google Places API key
  SUPABASE_URL             Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Supabase service role key
`);
}

async function main(): Promise<void> {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // Check required environment variables
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('Error: GOOGLE_PLACES_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('  Google Places Sync CLI');
  console.log('========================================\n');
  console.log('Configuration:');
  console.log(`  Type:           ${config.type}`);
  console.log(`  Max Places:     ${config.maxPlaces}`);
  console.log(`  Provinces:      ${config.provinces?.join(', ') || 'All'}`);
  console.log(`  Download Photos: ${config.downloadPhotos}`);
  console.log(`  Fetch Reviews:  ${config.fetchReviews}`);
  console.log('\nStarting sync...\n');

  try {
    const syncLog = await googlePlacesSyncService.startSync(config);

    console.log(`Sync started successfully!`);
    console.log(`  Sync ID: ${syncLog.id}`);
    console.log(`  Status:  ${syncLog.status}`);
    console.log('\nSync is running in background. Check logs or API for progress.');
    console.log(`\nTo check status:`);
    console.log(`  curl http://localhost:3091/api/admin/google-places/sync/logs\n`);

    // Wait for sync to complete (polling database)
    console.log('Waiting for sync to complete...\n');

    let completed = false;
    let lastStatus = '';

    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds

      const { data: syncStatus } = await supabaseAdmin
        .from('sync_logs')
        .select('*')
        .eq('id', syncLog.id)
        .single();

      if (syncStatus && syncStatus.status !== lastStatus) {
        lastStatus = syncStatus.status;
        console.log(`  Status: ${syncStatus.status}`);
      }

      if (syncStatus?.status === 'completed' || syncStatus?.status === 'failed' || syncStatus?.status === 'cancelled') {
        completed = true;

        console.log('\n========================================');
        console.log('  Sync Results');
        console.log('========================================\n');

        const metrics = syncStatus.metrics || {};
        console.log(`  Places Found:     ${metrics.places_found || 0}`);
        console.log(`  Places Updated:   ${metrics.places_updated || 0}`);
        console.log(`  Photos Downloaded: ${metrics.photos_downloaded || 0}`);
        console.log(`  Reviews Fetched:  ${metrics.reviews_fetched || 0}`);
        console.log(`  API Requests:     ${metrics.api_requests || 0}`);
        console.log(`  Estimated Cost:   $${(metrics.estimated_cost || 0).toFixed(2)}`);
        console.log(`  Duration:         ${metrics.duration_seconds || 0}s`);

        if (syncStatus.status === 'failed' && syncStatus.error_message) {
          console.log(`\n  Error: ${syncStatus.error_message}`);
        }
      }
    }

    console.log('\nDone!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\nSync failed:', error.message || error);
    process.exit(1);
  }
}

main();
