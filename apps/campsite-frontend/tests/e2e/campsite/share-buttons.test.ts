import { test, expect, type Page } from '@playwright/test';

test.describe('Campsite Share Buttons', () => {
  let page: Page;
  const testCampsiteSlug = 'test-campsite';
  const campsiteUrl = `/campsites/${testCampsiteSlug}`;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto(campsiteUrl);
  });

  test('share buttons are visible', async () => {
    const facebookButton = page.getByRole('button', { name: /share on facebook/i });
    const twitterButton = page.getByRole('button', { name: /share on twitter/i });
    const copyLinkButton = page.getByRole('button', { name: /copy link/i });

    await expect(facebookButton).toBeVisible();
    await expect(twitterButton).toBeVisible();
    await expect(copyLinkButton).toBeVisible();
  });

  test('Facebook share button opens share dialog', async ({ context }) => {
    const facebookButton = page.getByRole('button', { name: /share on facebook/i });

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      facebookButton.click()
    ]);

    const popupUrl = popup.url();
    expect(popupUrl).toContain('facebook.com/sharer');
    expect(popupUrl).toContain(encodeURIComponent(testCampsiteSlug));

    await popup.close();
  });

  test('Twitter share button opens share dialog', async ({ context }) => {
    const twitterButton = page.getByRole('button', { name: /share on twitter/i });

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      twitterButton.click()
    ]);

    const popupUrl = popup.url();
    expect(popupUrl).toContain('twitter.com/intent/tweet');
    expect(popupUrl).toContain(encodeURIComponent(testCampsiteSlug));

    await popup.close();
  });

  test('Copy link button copies URL to clipboard', async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyLinkButton = page.getByRole('button', { name: /copy link/i });
    await copyLinkButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(`/campsites/${testCampsiteSlug}`);

    const successMessage = page.getByText(/link copied|copied to clipboard/i);
    await expect(successMessage).toBeVisible();
  });

  test('Share URL contains campsite slug', async ({ context }) => {
    const facebookButton = page.getByRole('button', { name: /share on facebook/i });

    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      facebookButton.click()
    ]);

    const popupUrl = popup.url();
    const decodedUrl = decodeURIComponent(popupUrl);

    expect(decodedUrl).toContain(testCampsiteSlug);

    await popup.close();
  });

  test('Share buttons work with different campsite slugs', async () => {
    const differentSlug = 'another-campsite';
    await page.goto(`/campsites/${differentSlug}`);

    const copyLinkButton = page.getByRole('button', { name: /copy link/i });
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await copyLinkButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(`/campsites/${differentSlug}`);
  });

  test('Share buttons maintain accessibility attributes', async () => {
    const facebookButton = page.getByRole('button', { name: /share on facebook/i });
    const twitterButton = page.getByRole('button', { name: /share on twitter/i });
    const copyLinkButton = page.getByRole('button', { name: /copy link/i });

    await expect(facebookButton).toHaveAttribute('aria-label');
    await expect(twitterButton).toHaveAttribute('aria-label');
    await expect(copyLinkButton).toHaveAttribute('aria-label');
  });
});
