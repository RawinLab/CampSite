import { test, expect } from '@playwright/test';

test.describe('Map Clustering on Zoom Out', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
  });

  test('switch to map view and verify map loads', async ({ page }) => {
    // Switch to map view
    const mapViewButton = page.locator('[data-testid="view-toggle-map"]');
    await expect(mapViewButton).toBeVisible();
    await mapViewButton.click();

    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Verify map is visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Verify individual markers are visible when zoomed in
    const markers = page.locator('[data-testid^="marker-"]');
    await expect(markers.first()).toBeVisible({ timeout: 5000 });
  });

  test('clusters form when zooming out', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Wait for initial markers to load
    await page.waitForSelector('[data-testid^="marker-"]', { state: 'visible', timeout: 5000 });

    // Get initial marker count (individual markers when zoomed in)
    const initialMarkers = page.locator('[data-testid^="marker-individual-"]');
    const initialCount = await initialMarkers.count();

    // Zoom out on the map
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    await zoomOutButton.click();
    await page.waitForTimeout(500); // Wait for zoom animation

    // Zoom out again to ensure clustering
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Verify cluster markers appear
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    await expect(clusterMarkers.first()).toBeVisible({ timeout: 3000 });

    // Verify at least one cluster marker exists
    const clusterCount = await clusterMarkers.count();
    expect(clusterCount).toBeGreaterThan(0);

    // Verify individual markers decreased (merged into clusters)
    const remainingIndividualMarkers = await initialMarkers.count();
    expect(remainingIndividualMarkers).toBeLessThan(initialCount);
  });

  test('cluster markers display count badge', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Zoom out to create clusters
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Wait for cluster markers to appear
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    await expect(clusterMarkers.first()).toBeVisible({ timeout: 3000 });

    // Verify first cluster has a count badge
    const firstCluster = clusterMarkers.first();
    const countBadge = firstCluster.locator('[data-testid="cluster-count"]');
    await expect(countBadge).toBeVisible();

    // Verify count badge shows a number > 1
    const countText = await countBadge.textContent();
    const count = parseInt(countText || '0', 10);
    expect(count).toBeGreaterThan(1);
  });

  test('clicking cluster zooms in to show individual markers', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Zoom out to create clusters
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Wait for cluster markers to appear
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    await expect(clusterMarkers.first()).toBeVisible({ timeout: 3000 });

    // Get the count from the first cluster
    const firstCluster = clusterMarkers.first();
    const countBadge = firstCluster.locator('[data-testid="cluster-count"]');
    const countText = await countBadge.textContent();
    const expectedCount = parseInt(countText || '0', 10);

    // Click on the cluster
    await firstCluster.click();
    await page.waitForTimeout(1000); // Wait for zoom animation

    // Verify map zoomed in (cluster should either be gone or split into smaller clusters/individual markers)
    // Count individual markers that are now visible in the expanded area
    const individualMarkers = page.locator('[data-testid^="marker-individual-"]');
    const visibleMarkers = await individualMarkers.count();

    // Verify we can see individual markers or the cluster has been broken down
    expect(visibleMarkers).toBeGreaterThan(0);
  });

  test('cluster count matches number of grouped campsites', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Zoom out to create clusters
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Wait for cluster markers to appear
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    await expect(clusterMarkers.first()).toBeVisible({ timeout: 3000 });

    // Get count from first cluster
    const firstCluster = clusterMarkers.first();
    const countBadge = firstCluster.locator('[data-testid="cluster-count"]');
    const countText = await countBadge.textContent();
    const clusterCount = parseInt(countText || '0', 10);

    // Hover over cluster to show tooltip with campsite details
    await firstCluster.hover();
    await page.waitForTimeout(300);

    // Verify tooltip appears
    const clusterTooltip = page.locator('[data-testid="cluster-tooltip"]');
    await expect(clusterTooltip).toBeVisible({ timeout: 2000 });

    // Verify tooltip shows the count
    await expect(clusterTooltip).toContainText(`${clusterCount}`);
    await expect(clusterTooltip).toContainText(/campsite/i);
  });

  test('zooming back in breaks clusters into individual markers', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Wait for initial individual markers
    await page.waitForSelector('[data-testid^="marker-individual-"]', { state: 'visible', timeout: 5000 });
    const initialIndividualCount = await page.locator('[data-testid^="marker-individual-"]').count();

    // Zoom out to create clusters
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    const zoomInButton = page.locator('[data-testid="map-zoom-in"]');

    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Verify clusters exist
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    const clusterCount = await clusterMarkers.count();
    expect(clusterCount).toBeGreaterThan(0);

    // Zoom back in
    await zoomInButton.click();
    await page.waitForTimeout(500);
    await zoomInButton.click();
    await page.waitForTimeout(500);
    await zoomInButton.click();
    await page.waitForTimeout(500);

    // Verify clusters have broken back into individual markers
    const finalIndividualCount = await page.locator('[data-testid^="marker-individual-"]').count();
    expect(finalIndividualCount).toBeGreaterThan(0);

    // Verify cluster count decreased or is zero
    const finalClusterCount = await page.locator('[data-testid^="marker-cluster-"]').count();
    expect(finalClusterCount).toBeLessThan(clusterCount);
  });

  test('filtered results show correct cluster counts', async ({ page }) => {
    // Apply a province filter first
    await page.locator('[data-testid="province-filter"]').click();
    await page.locator('[data-testid="province-option-chiang-mai"]').click();
    await page.waitForResponse(response => response.url().includes('/api/campsites'));

    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Wait for markers to load with filtered data
    await page.waitForTimeout(1000);

    // Zoom out to create clusters
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Verify clusters appear with filtered data
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    const individualMarkers = page.locator('[data-testid^="marker-individual-"]');

    // Get total marker count (clusters + individual)
    const totalClusters = await clusterMarkers.count();
    const totalIndividual = await individualMarkers.count();

    // Verify some markers are present (either clusters or individual)
    expect(totalClusters + totalIndividual).toBeGreaterThan(0);

    // If clusters exist, verify they show counts
    if (totalClusters > 0) {
      const firstCluster = clusterMarkers.first();
      const countBadge = firstCluster.locator('[data-testid="cluster-count"]');
      await expect(countBadge).toBeVisible();

      const countText = await countBadge.textContent();
      const count = parseInt(countText || '0', 10);
      expect(count).toBeGreaterThan(1);
    }
  });

  test('cluster appearance changes based on size', async ({ page }) => {
    // Switch to map view
    await page.locator('[data-testid="view-toggle-map"]').click();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });

    // Zoom out significantly to create large clusters
    const zoomOutButton = page.locator('[data-testid="map-zoom-out"]');
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);
    await zoomOutButton.click();
    await page.waitForTimeout(500);

    // Wait for cluster markers to appear
    const clusterMarkers = page.locator('[data-testid^="marker-cluster-"]');
    await expect(clusterMarkers.first()).toBeVisible({ timeout: 3000 });

    const clusterCount = await clusterMarkers.count();
    if (clusterCount > 1) {
      // Get counts from different clusters
      const firstCluster = clusterMarkers.nth(0);
      const secondCluster = clusterMarkers.nth(1);

      const firstCountBadge = firstCluster.locator('[data-testid="cluster-count"]');
      const secondCountBadge = secondCluster.locator('[data-testid="cluster-count"]');

      const firstCount = parseInt((await firstCountBadge.textContent()) || '0', 10);
      const secondCount = parseInt((await secondCountBadge.textContent()) || '0', 10);

      // Verify both clusters show valid counts
      expect(firstCount).toBeGreaterThan(1);
      expect(secondCount).toBeGreaterThan(1);

      // Verify clusters have size-based styling (data attribute or class)
      const firstClusterSize = await firstCluster.getAttribute('data-cluster-size');
      const secondClusterSize = await secondCluster.getAttribute('data-cluster-size');

      // Size categories should exist (small, medium, large)
      expect(firstClusterSize).toBeTruthy();
      expect(secondClusterSize).toBeTruthy();
    }
  });
});
