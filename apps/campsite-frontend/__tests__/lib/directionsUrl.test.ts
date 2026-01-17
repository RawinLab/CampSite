import { getGoogleMapsDirectionsUrl } from '@campsite/shared';

describe('getGoogleMapsDirectionsUrl', () => {
  describe('URL generation', () => {
    it('should generate correct Google Maps directions URL', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/13.7563,100.5018/14.8825,100.9925');
    });

    it('should use Google Maps domain', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, 14.8825, 100.9925);

      expect(url).toContain('https://www.google.com/maps/dir/');
    });

    it('should include correct origin coordinates', () => {
      const originLat = 13.7563;
      const originLng = 100.5018;
      const url = getGoogleMapsDirectionsUrl(originLat, originLng, 14.8825, 100.9925);

      expect(url).toContain(`${originLat},${originLng}`);
    });

    it('should include correct destination coordinates', () => {
      const destLat = 14.8825;
      const destLng = 100.9925;
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, destLat, destLng);

      expect(url).toContain(`${destLat},${destLng}`);
    });
  });

  describe('coordinate format handling', () => {
    it('should work with positive latitude and longitude', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, 18.7883, 98.9853);

      expect(url).toBe('https://www.google.com/maps/dir/13.7563,100.5018/18.7883,98.9853');
    });

    it('should work with negative latitude', () => {
      const url = getGoogleMapsDirectionsUrl(-13.7563, 100.5018, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/-13.7563,100.5018/14.8825,100.9925');
    });

    it('should work with negative longitude', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, -100.5018, 14.8825, -100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/13.7563,-100.5018/14.8825,-100.9925');
    });

    it('should work with integer coordinates', () => {
      const url = getGoogleMapsDirectionsUrl(13, 100, 14, 101);

      expect(url).toBe('https://www.google.com/maps/dir/13,100/14,101');
    });

    it('should work with high-precision decimal coordinates', () => {
      const url = getGoogleMapsDirectionsUrl(13.756372, 100.501762, 14.882501, 100.992513);

      expect(url).toBe('https://www.google.com/maps/dir/13.756372,100.501762/14.882501,100.992513');
    });

    it('should work with zero coordinates', () => {
      const url = getGoogleMapsDirectionsUrl(0, 0, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/0,0/14.8825,100.9925');
    });
  });

  describe('URL structure', () => {
    it('should have origin and destination separated by slash', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, 14.8825, 100.9925);

      expect(url.split('/')).toHaveLength(7); // https:, , www.google.com, maps, dir, origin, destination
      expect(url.split('/')[5]).toBe('13.7563,100.5018');
      expect(url.split('/')[6]).toBe('14.8825,100.9925');
    });

    it('should have latitude and longitude separated by comma without spaces', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, 14.8825, 100.9925);

      expect(url).not.toContain(' ');
      expect(url).toContain(',');
    });

    it('should not require URL encoding for standard coordinates', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 100.5018, 14.8825, 100.9925);

      // URL should not contain encoded characters like %2C (comma) or %2F (slash)
      expect(url).not.toContain('%');
    });
  });

  describe('real-world Thailand coordinates', () => {
    it('should generate URL for Bangkok to Chiang Mai route', () => {
      const bangkokLat = 13.7563;
      const bangkokLng = 100.5018;
      const chiangMaiLat = 18.7883;
      const chiangMaiLng = 98.9853;

      const url = getGoogleMapsDirectionsUrl(bangkokLat, bangkokLng, chiangMaiLat, chiangMaiLng);

      expect(url).toBe('https://www.google.com/maps/dir/13.7563,100.5018/18.7883,98.9853');
    });

    it('should generate URL for campsite to nearby attraction', () => {
      const campsiteLat = 14.8825;
      const campsiteLng = 100.9925;
      const attractionLat = 14.8901;
      const attractionLng = 101.0042;

      const url = getGoogleMapsDirectionsUrl(campsiteLat, campsiteLng, attractionLat, attractionLng);

      expect(url).toBe('https://www.google.com/maps/dir/14.8825,100.9925/14.8901,101.0042');
    });

    it('should generate URL for Phuket coordinates', () => {
      const phuketLat = 7.8804;
      const phuketLng = 98.3923;
      const patongLat = 7.8961;
      const patongLng = 98.2963;

      const url = getGoogleMapsDirectionsUrl(phuketLat, phuketLng, patongLat, patongLng);

      expect(url).toBe('https://www.google.com/maps/dir/7.8804,98.3923/7.8961,98.2963');
    });
  });

  describe('edge cases', () => {
    it('should handle maximum latitude (90 degrees)', () => {
      const url = getGoogleMapsDirectionsUrl(90, 100.5018, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/90,100.5018/14.8825,100.9925');
    });

    it('should handle minimum latitude (-90 degrees)', () => {
      const url = getGoogleMapsDirectionsUrl(-90, 100.5018, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/-90,100.5018/14.8825,100.9925');
    });

    it('should handle maximum longitude (180 degrees)', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, 180, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/13.7563,180/14.8825,100.9925');
    });

    it('should handle minimum longitude (-180 degrees)', () => {
      const url = getGoogleMapsDirectionsUrl(13.7563, -180, 14.8825, 100.9925);

      expect(url).toBe('https://www.google.com/maps/dir/13.7563,-180/14.8825,100.9925');
    });

    it('should handle very small decimal differences', () => {
      const url = getGoogleMapsDirectionsUrl(13.756301, 100.501801, 13.756302, 100.501802);

      expect(url).toBe('https://www.google.com/maps/dir/13.756301,100.501801/13.756302,100.501802');
    });
  });
});
