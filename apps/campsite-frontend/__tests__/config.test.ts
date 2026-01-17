import nextConfig from '../next.config';

describe('Next.js Configuration', () => {
  it('has transpilePackages for shared package', () => {
    expect(nextConfig.transpilePackages).toContain('@campsite/shared');
  });

  it('has image configuration for Supabase', () => {
    expect(nextConfig.images?.remotePatterns).toBeDefined();
    const supabasePattern = nextConfig.images?.remotePatterns?.find(
      (p) => p.hostname === '**.supabase.co'
    );
    expect(supabasePattern).toBeDefined();
  });
});
