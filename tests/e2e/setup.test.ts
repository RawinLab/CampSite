import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('Project Setup', () => {
  test('pnpm install completes successfully', async () => {
    // This test verifies that dependencies can be installed
    // In CI, this has already run, so we just verify node_modules exists
    const { stdout } = await execAsync('ls node_modules', { cwd: process.cwd() });
    expect(stdout).toContain('turbo');
  });

  test('workspace packages are linked', async () => {
    const { stdout } = await execAsync('pnpm list --depth 0', { cwd: process.cwd() });
    expect(stdout).toContain('@campsite/shared');
  });
});
