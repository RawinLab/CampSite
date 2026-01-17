/**
 * Format utilities for the Camping Thailand platform
 */

/**
 * Format price in Thai Baht
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format price range
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

/**
 * Format distance in km
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} ม.`;
  }
  return `${km.toFixed(1)} กม.`;
}

/**
 * Format date in Thai locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'วันนี้';
  } else if (diffDays === 1) {
    return 'เมื่อวาน';
  } else if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} สัปดาห์ที่แล้ว`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} เดือนที่แล้ว`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ปีที่แล้ว`;
  }
}

/**
 * Format time (e.g., "14:00" to "14:00 น.")
 */
export function formatTime(time: string): string {
  return `${time} น.`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format Thai mobile number (10 digits)
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Format rating to one decimal place
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Get rating text description
 */
export function getRatingText(rating: number): string {
  if (rating >= 4.5) return 'ยอดเยี่ยม';
  if (rating >= 4.0) return 'ดีมาก';
  if (rating >= 3.5) return 'ดี';
  if (rating >= 3.0) return 'ปานกลาง';
  if (rating >= 2.0) return 'พอใช้';
  return 'ต้องปรับปรุง';
}

/**
 * Format capacity
 */
export function formatCapacity(capacity: number): string {
  return `${capacity} คน`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get reviewer type label in Thai
 */
export function getReviewerTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    family: 'ครอบครัว',
    couple: 'คู่รัก',
    solo: 'เดี่ยว',
    group: 'กลุ่มเพื่อน',
  };
  return labels[type] || type;
}

/**
 * Get attraction category label in Thai
 */
export function getAttractionCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    hiking: 'เส้นทางเดินป่า',
    waterfall: 'น้ำตก',
    temple: 'วัด',
    viewpoint: 'จุดชมวิว',
    lake: 'ทะเลสาบ',
    cave: 'ถ้ำ',
    market: 'ตลาด',
    other: 'อื่นๆ',
  };
  return labels[category] || category;
}

/**
 * Get difficulty label in Thai
 */
export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'ง่าย',
    moderate: 'ปานกลาง',
    hard: 'ยาก',
  };
  return labels[difficulty] || difficulty;
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: 'text-green-600 bg-green-100',
    moderate: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };
  return colors[difficulty] || 'text-gray-600 bg-gray-100';
}
