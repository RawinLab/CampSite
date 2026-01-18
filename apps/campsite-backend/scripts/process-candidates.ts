#!/usr/bin/env tsx
/**
 * CLI Script: Process Google Places Candidates with AI
 *
 * Runs the AI processing pipeline on raw Google Places data:
 * - Deduplication detection
 * - Campsite type classification
 * - Province matching
 * - Creates import candidates for admin review
 *
 * Usage:
 *   pnpm tsx scripts/process-candidates.ts [options]
 *
 * Options:
 *   --all                       Process all unprocessed raw places
 *   --ids <id1,id2,...>         Process specific raw place IDs
 *   --limit <number>            Limit number of places to process (default: 100)
 *   --reprocess                 Reprocess places that already have candidates
 *   --help                      Show help
 *
 * Examples:
 *   pnpm tsx scripts/process-candidates.ts --all --limit 50
 *   pnpm tsx scripts/process-candidates.ts --ids abc123,def456
 */

interface CliOptions {
  all: boolean;
  ids: string[];
  limit: number;
  reprocess: boolean;
  help: boolean;
}

// Parse command line arguments
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    all: false,
    ids: [],
    limit: 100,
    reprocess: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--all':
      case '-a':
        options.all = true;
        break;
      case '--ids':
      case '-i':
        options.ids = args[++i].split(',').map(s => s.trim());
        break;
      case '--limit':
      case '-l':
        options.limit = parseInt(args[++i], 10);
        if (isNaN(options.limit) || options.limit <= 0) {
          console.error('Invalid limit value. Must be a positive number.');
          process.exit(1);
        }
        break;
      case '--reprocess':
      case '-r':
        options.reprocess = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
AI Processing CLI - Process Google Places Candidates

This script runs the AI processing pipeline on raw Google Places data:
  1. Deduplication detection (checks against existing campsites)
  2. Campsite type classification (camping, glamping, tented-resort, bungalow)
  3. Province matching (from coordinates)
  4. Creates import candidates for admin review

Usage:
  pnpm tsx scripts/process-candidates.ts [options]

Options:
  --all, -a                     Process all unprocessed raw places
  --ids, -i <id1,id2,...>       Process specific raw place IDs (comma-separated)
  --limit, -l <number>          Limit number of places to process (default: 100)
  --reprocess, -r               Reprocess places that already have candidates
  --help, -h                    Show this help message

Examples:
  # Process all unprocessed places (max 50)
  pnpm tsx scripts/process-candidates.ts --all --limit 50

  # Process specific places by ID
  pnpm tsx scripts/process-candidates.ts --ids abc123,def456,ghi789

  # Reprocess all places (including already processed ones)
  pnpm tsx scripts/process-candidates.ts --all --reprocess --limit 100

Environment Variables Required:
  SUPABASE_URL                 Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    Supabase service role key
  GEMINI_API_KEY               Google Gemini API key (optional, for AI classification)
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (!options.all && options.ids.length === 0) {
    console.error('Error: You must specify --all or --ids');
    showHelp();
    process.exit(1);
  }

  // Load environment variables BEFORE importing modules
  const path = await import('path');
  const dotenv = await import('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '../.env') });

  // Now dynamically import modules that depend on environment variables
  const { supabaseAdmin } = await import('../src/lib/supabase');
  const aiProcessingServiceModule = await import('../src/services/google-places/ai-processing.service');
  const aiProcessingService = aiProcessingServiceModule.default;

  console.log('\n========================================');
  console.log('  AI Processing CLI');
  console.log('========================================\n');

  let placeIds: string[] = [];

  async function getUnprocessedPlaceIds(limit: number, reprocess: boolean): Promise<string[]> {
    if (reprocess) {
      // Get all raw places
      const { data, error } = await supabaseAdmin
        .from('google_places_raw')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch raw places: ${error.message}`);
      }

      return (data || []).map((p: any) => p.id);
    } else {
      // Get all raw places and filter manually
      const { data: allRaw } = await supabaseAdmin
        .from('google_places_raw')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      const { data: existing } = await supabaseAdmin
        .from('google_places_import_candidates')
        .select('google_place_raw_id');

      const existingIds = new Set((existing || []).map((c: any) => c.google_place_raw_id));
      const unprocessed = (allRaw || []).filter((p: any) => !existingIds.has(p.id));

      return unprocessed.slice(0, limit).map((p: any) => p.id);
    }
  }

  if (options.ids.length > 0) {
    placeIds = options.ids;
    console.log(`Processing ${placeIds.length} specified place(s)...\n`);
  } else if (options.all) {
    console.log('Fetching unprocessed places...');
    placeIds = await getUnprocessedPlaceIds(options.limit, options.reprocess);
    console.log(`Found ${placeIds.length} place(s) to process.\n`);
  }

  if (placeIds.length === 0) {
    console.log('No places to process. Done!\n');
    process.exit(0);
  }

  console.log('Configuration:');
  console.log(`  Places to process: ${placeIds.length}`);
  console.log(`  Reprocess mode:    ${options.reprocess}`);
  console.log('\nStarting AI processing pipeline...\n');

  const startTime = Date.now();

  try {
    const result = await aiProcessingService.processPlaces(placeIds);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n========================================');
    console.log('  Processing Results');
    console.log('========================================\n');
    console.log(`  Total Processed:     ${placeIds.length}`);
    console.log(`  Successful:          ${result.successful}`);
    console.log(`  Failed:              ${result.failed}`);
    console.log(`  Candidates Created:  ${result.candidatesCreated}`);
    console.log(`  Duration:            ${duration}s`);
    console.log(`  Avg per place:       ${(parseFloat(duration) / placeIds.length).toFixed(2)}s`);

    // Show summary of candidates status
    const { data: candidateSummary } = await supabaseAdmin
      .from('google_places_import_candidates')
      .select('status')
      .in('google_place_raw_id', placeIds);

    if (candidateSummary && candidateSummary.length > 0) {
      const statusCounts = candidateSummary.reduce((acc: Record<string, number>, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      console.log('\n  Candidate Status Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`    - ${status}: ${count}`);
      });
    }

    console.log('\nDone! Review candidates in the admin dashboard.\n');
    console.log('Admin dashboard: /admin/google-places/candidates\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\nProcessing failed:', error.message || error);
    process.exit(1);
  }
}

main();
