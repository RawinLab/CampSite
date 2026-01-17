import type { CampsiteDetail } from '@campsite/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CompareResponse {
  success: boolean;
  data: {
    campsites: CampsiteDetail[];
  };
}

/**
 * Fetch campsite details for comparison
 */
export async function fetchCampsitesForComparison(
  ids: string[]
): Promise<CampsiteDetail[]> {
  if (ids.length < 2 || ids.length > 3) {
    throw new Error('2-3 campsite IDs required for comparison');
  }

  const params = new URLSearchParams({
    ids: ids.join(','),
  });

  const response = await fetch(`${API_BASE_URL}/api/campsites/compare?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch comparison data' }));
    throw new Error(error.error || 'Failed to fetch comparison data');
  }

  const result: CompareResponse = await response.json();
  return result.data?.campsites || [];
}
