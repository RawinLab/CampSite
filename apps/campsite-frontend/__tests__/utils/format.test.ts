import {
  formatPrice,
  formatPriceRange,
  formatDistance,
  formatDate,
  formatRelativeTime,
  formatTime,
  formatPhoneNumber,
  formatRating,
  getRatingText,
  formatCapacity,
  truncateText,
  getReviewerTypeLabel,
  getAttractionCategoryLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from '@/lib/utils/format';

describe('Format Utilities', () => {
  describe('formatPrice', () => {
    it('should format price in Thai Baht with symbol', () => {
      expect(formatPrice(1000)).toBe('฿1,000');
    });

    it('should handle zero price', () => {
      expect(formatPrice(0)).toBe('฿0');
    });

    it('should handle negative prices', () => {
      expect(formatPrice(-500)).toBe('-฿500');
    });

    it('should format large numbers with thousands separator', () => {
      expect(formatPrice(1234567)).toBe('฿1,234,567');
    });

    it('should round decimals to whole numbers', () => {
      expect(formatPrice(999.99)).toBe('฿1,000');
      expect(formatPrice(100.49)).toBe('฿100');
    });

    it('should handle very large numbers', () => {
      expect(formatPrice(10000000)).toBe('฿10,000,000');
    });
  });

  describe('formatPriceRange', () => {
    it('should format price range with different min and max', () => {
      expect(formatPriceRange(500, 1000)).toBe('฿500 - ฿1,000');
    });

    it('should format single price when min equals max', () => {
      expect(formatPriceRange(1000, 1000)).toBe('฿1,000');
    });

    it('should handle zero range', () => {
      expect(formatPriceRange(0, 0)).toBe('฿0');
    });

    it('should format large price ranges', () => {
      expect(formatPriceRange(1000, 5000000)).toBe('฿1,000 - ฿5,000,000');
    });
  });

  describe('formatDistance', () => {
    it('should format distance less than 1 km in meters', () => {
      expect(formatDistance(0.5)).toBe('500 ม.');
      expect(formatDistance(0.123)).toBe('123 ม.');
    });

    it('should format distance 1 km or more with one decimal', () => {
      expect(formatDistance(1)).toBe('1.0 กม.');
      expect(formatDistance(5.7)).toBe('5.7 กม.');
      expect(formatDistance(12.345)).toBe('12.3 กม.');
    });

    it('should handle zero distance', () => {
      expect(formatDistance(0)).toBe('0 ม.');
    });

    it('should round meters for small distances', () => {
      expect(formatDistance(0.0567)).toBe('57 ม.');
    });

    it('should format large distances', () => {
      expect(formatDistance(150.8)).toBe('150.8 กม.');
    });
  });

  describe('formatDate', () => {
    it('should format date string in Thai locale', () => {
      const date = '2024-01-15';
      const result = formatDate(date);
      expect(result).toContain('15');
      // Thai locale uses Buddhist calendar (2567 = 2024 + 543)
      expect(result).toMatch(/\d{4}/); // Contains a 4-digit year
    });

    it('should format Date object in Thai locale', () => {
      const date = new Date('2024-06-20');
      const result = formatDate(date);
      expect(result).toContain('20');
      expect(result).toMatch(/\d{4}/); // Contains a 4-digit year
    });

    it('should handle various date formats', () => {
      const isoDate = formatDate('2024-12-25T10:30:00Z');
      expect(isoDate).toContain('25');
      expect(isoDate).toMatch(/\d{4}/); // Contains a 4-digit year
    });

    it('should format with Thai month names', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      // Should contain Thai month name (e.g., มกราคม, กุมภาพันธ์, etc.)
      expect(result).toMatch(/[ก-๙]/); // Contains Thai characters
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "วันนี้" for today', () => {
      const today = new Date('2024-01-15T08:00:00Z');
      expect(formatRelativeTime(today)).toBe('วันนี้');
    });

    it('should return "เมื่อวาน" for yesterday', () => {
      const yesterday = new Date('2024-01-14T12:00:00Z');
      expect(formatRelativeTime(yesterday)).toBe('เมื่อวาน');
    });

    it('should return days ago for less than a week', () => {
      const threeDaysAgo = new Date('2024-01-12T12:00:00Z');
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 วันที่แล้ว');
    });

    it('should return weeks ago for less than a month', () => {
      const twoWeeksAgo = new Date('2024-01-01T12:00:00Z');
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 สัปดาห์ที่แล้ว');
    });

    it('should return months ago for less than a year', () => {
      const twoMonthsAgo = new Date('2023-11-15T12:00:00Z');
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2 เดือนที่แล้ว');
    });

    it('should return years ago for more than a year', () => {
      const twoYearsAgo = new Date('2022-01-15T12:00:00Z');
      expect(formatRelativeTime(twoYearsAgo)).toBe('2 ปีที่แล้ว');
    });

    it('should handle string dates', () => {
      const dateString = '2024-01-10T12:00:00Z';
      expect(formatRelativeTime(dateString)).toBe('5 วันที่แล้ว');
    });
  });

  describe('formatTime', () => {
    it('should add Thai time suffix to time string', () => {
      expect(formatTime('14:00')).toBe('14:00 น.');
      expect(formatTime('09:30')).toBe('09:30 น.');
      expect(formatTime('23:59')).toBe('23:59 น.');
    });

    it('should handle various time formats', () => {
      expect(formatTime('8:00')).toBe('8:00 น.');
      expect(formatTime('00:00')).toBe('00:00 น.');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit Thai mobile number', () => {
      expect(formatPhoneNumber('0812345678')).toBe('081-234-5678');
      expect(formatPhoneNumber('0987654321')).toBe('098-765-4321');
    });

    it('should format number with existing dashes', () => {
      expect(formatPhoneNumber('081-234-5678')).toBe('081-234-5678');
    });

    it('should format number with spaces', () => {
      expect(formatPhoneNumber('081 234 5678')).toBe('081-234-5678');
    });

    it('should format number with mixed separators', () => {
      expect(formatPhoneNumber('081-234 5678')).toBe('081-234-5678');
    });

    it('should not format non-10-digit numbers', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
      expect(formatPhoneNumber('081234567890')).toBe('081234567890');
    });

    it('should not format numbers not starting with 0', () => {
      expect(formatPhoneNumber('9812345678')).toBe('9812345678');
    });

    it('should handle numbers with parentheses', () => {
      expect(formatPhoneNumber('(081)2345678')).toBe('081-234-5678');
    });
  });

  describe('formatRating', () => {
    it('should format rating to one decimal place', () => {
      expect(formatRating(4.5)).toBe('4.5');
      expect(formatRating(3.2)).toBe('3.2');
    });

    it('should round to one decimal place', () => {
      expect(formatRating(4.567)).toBe('4.6');
      expect(formatRating(3.123)).toBe('3.1');
    });

    it('should handle whole numbers', () => {
      expect(formatRating(5)).toBe('5.0');
      expect(formatRating(3)).toBe('3.0');
    });

    it('should handle zero rating', () => {
      expect(formatRating(0)).toBe('0.0');
    });

    it('should handle negative ratings', () => {
      expect(formatRating(-1.5)).toBe('-1.5');
    });
  });

  describe('getRatingText', () => {
    it('should return "ยอดเยี่ยม" for ratings >= 4.5', () => {
      expect(getRatingText(4.5)).toBe('ยอดเยี่ยม');
      expect(getRatingText(5.0)).toBe('ยอดเยี่ยม');
    });

    it('should return "ดีมาก" for ratings >= 4.0', () => {
      expect(getRatingText(4.0)).toBe('ดีมาก');
      expect(getRatingText(4.4)).toBe('ดีมาก');
    });

    it('should return "ดี" for ratings >= 3.5', () => {
      expect(getRatingText(3.5)).toBe('ดี');
      expect(getRatingText(3.9)).toBe('ดี');
    });

    it('should return "ปานกลาง" for ratings >= 3.0', () => {
      expect(getRatingText(3.0)).toBe('ปานกลาง');
      expect(getRatingText(3.4)).toBe('ปานกลาง');
    });

    it('should return "พอใช้" for ratings >= 2.0', () => {
      expect(getRatingText(2.0)).toBe('พอใช้');
      expect(getRatingText(2.9)).toBe('พอใช้');
    });

    it('should return "ต้องปรับปรุง" for ratings < 2.0', () => {
      expect(getRatingText(1.9)).toBe('ต้องปรับปรุง');
      expect(getRatingText(1.0)).toBe('ต้องปรับปรุง');
      expect(getRatingText(0)).toBe('ต้องปรับปรุง');
    });
  });

  describe('formatCapacity', () => {
    it('should format capacity with Thai suffix', () => {
      expect(formatCapacity(4)).toBe('4 คน');
      expect(formatCapacity(10)).toBe('10 คน');
    });

    it('should handle zero capacity', () => {
      expect(formatCapacity(0)).toBe('0 คน');
    });

    it('should handle large capacity', () => {
      expect(formatCapacity(100)).toBe('100 คน');
    });

    it('should handle single person capacity', () => {
      expect(formatCapacity(1)).toBe('1 คน');
    });
  });

  describe('truncateText', () => {
    it('should not truncate text shorter than max length', () => {
      expect(truncateText('Short text', 20)).toBe('Short text');
    });

    it('should truncate text longer than max length', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
    });

    it('should truncate exactly at max length', () => {
      expect(truncateText('Exactly ten characters', 10)).toBe('Exactly...');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should handle max length of 3 (minimum for ellipsis)', () => {
      expect(truncateText('Hello', 3)).toBe('...');
    });

    it('should preserve text when length equals max length', () => {
      expect(truncateText('12345', 5)).toBe('12345');
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000);
      const result = truncateText(longText, 50);
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('getReviewerTypeLabel', () => {
    it('should return Thai label for family', () => {
      expect(getReviewerTypeLabel('family')).toBe('ครอบครัว');
    });

    it('should return Thai label for couple', () => {
      expect(getReviewerTypeLabel('couple')).toBe('คู่รัก');
    });

    it('should return Thai label for solo', () => {
      expect(getReviewerTypeLabel('solo')).toBe('เดี่ยว');
    });

    it('should return Thai label for group', () => {
      expect(getReviewerTypeLabel('group')).toBe('กลุ่มเพื่อน');
    });

    it('should return original type for unknown types', () => {
      expect(getReviewerTypeLabel('unknown')).toBe('unknown');
      expect(getReviewerTypeLabel('business')).toBe('business');
    });

    it('should handle empty string', () => {
      expect(getReviewerTypeLabel('')).toBe('');
    });
  });

  describe('getAttractionCategoryLabel', () => {
    it('should return Thai label for hiking', () => {
      expect(getAttractionCategoryLabel('hiking')).toBe('เส้นทางเดินป่า');
    });

    it('should return Thai label for waterfall', () => {
      expect(getAttractionCategoryLabel('waterfall')).toBe('น้ำตก');
    });

    it('should return Thai label for temple', () => {
      expect(getAttractionCategoryLabel('temple')).toBe('วัด');
    });

    it('should return Thai label for viewpoint', () => {
      expect(getAttractionCategoryLabel('viewpoint')).toBe('จุดชมวิว');
    });

    it('should return Thai label for lake', () => {
      expect(getAttractionCategoryLabel('lake')).toBe('ทะเลสาบ');
    });

    it('should return Thai label for cave', () => {
      expect(getAttractionCategoryLabel('cave')).toBe('ถ้ำ');
    });

    it('should return Thai label for market', () => {
      expect(getAttractionCategoryLabel('market')).toBe('ตลาด');
    });

    it('should return Thai label for other', () => {
      expect(getAttractionCategoryLabel('other')).toBe('อื่นๆ');
    });

    it('should return original category for unknown categories', () => {
      expect(getAttractionCategoryLabel('beach')).toBe('beach');
      expect(getAttractionCategoryLabel('museum')).toBe('museum');
    });
  });

  describe('getDifficultyLabel', () => {
    it('should return Thai label for easy', () => {
      expect(getDifficultyLabel('easy')).toBe('ง่าย');
    });

    it('should return Thai label for moderate', () => {
      expect(getDifficultyLabel('moderate')).toBe('ปานกลาง');
    });

    it('should return Thai label for hard', () => {
      expect(getDifficultyLabel('hard')).toBe('ยาก');
    });

    it('should return original difficulty for unknown difficulties', () => {
      expect(getDifficultyLabel('extreme')).toBe('extreme');
      expect(getDifficultyLabel('beginner')).toBe('beginner');
    });

    it('should handle empty string', () => {
      expect(getDifficultyLabel('')).toBe('');
    });
  });

  describe('getDifficultyColor', () => {
    it('should return green color classes for easy', () => {
      expect(getDifficultyColor('easy')).toBe('text-green-600 bg-green-100');
    });

    it('should return yellow color classes for moderate', () => {
      expect(getDifficultyColor('moderate')).toBe('text-yellow-600 bg-yellow-100');
    });

    it('should return red color classes for hard', () => {
      expect(getDifficultyColor('hard')).toBe('text-red-600 bg-red-100');
    });

    it('should return gray color classes for unknown difficulties', () => {
      expect(getDifficultyColor('extreme')).toBe('text-gray-600 bg-gray-100');
      expect(getDifficultyColor('unknown')).toBe('text-gray-600 bg-gray-100');
    });

    it('should return gray color classes for empty string', () => {
      expect(getDifficultyColor('')).toBe('text-gray-600 bg-gray-100');
    });
  });
});
