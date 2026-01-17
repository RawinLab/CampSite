import { render, screen } from '@testing-library/react';
import { PasswordStrength, isPasswordStrong } from '@/components/auth/PasswordStrength';

describe('PasswordStrength Component', () => {
  describe('Rendering behavior', () => {
    it('returns null when password is empty', () => {
      const { container } = render(<PasswordStrength password="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders component when password is provided', () => {
      render(<PasswordStrength password="a" />);
      expect(screen.getByText('อย่างน้อย 8 ตัวอักษร')).toBeInTheDocument();
      expect(screen.getByText('มีตัวพิมพ์ใหญ่')).toBeInTheDocument();
      expect(screen.getByText('มีตัวเลข')).toBeInTheDocument();
      expect(screen.getByText('มีอักขระพิเศษ')).toBeInTheDocument();
    });
  });

  describe('Strength levels', () => {
    it('shows "อ่อน" (weak) when only 1 criterion is met', () => {
      render(<PasswordStrength password="abcdefgh" />); // Only length >= 8
      expect(screen.getByText('อ่อน')).toBeInTheDocument();
    });

    it('shows "พอใช้" (fair) when 2 criteria are met', () => {
      render(<PasswordStrength password="Abcdefgh" />); // Length + uppercase
      expect(screen.getByText('พอใช้')).toBeInTheDocument();
    });

    it('shows "ดี" (good) when 3 criteria are met', () => {
      render(<PasswordStrength password="Abcdefg1" />); // Length + uppercase + number
      expect(screen.getByText('ดี')).toBeInTheDocument();
    });

    it('shows "แข็งแกร่ง" (strong) when all 4 criteria are met', () => {
      render(<PasswordStrength password="Abcdef1!" />); // All criteria
      expect(screen.getByText('แข็งแกร่ง')).toBeInTheDocument();
    });
  });

  describe('Progress bars', () => {
    it('fills 1 bar when 1 criterion is met', () => {
      const { container } = render(<PasswordStrength password="abcdefgh" />);
      const bars = container.querySelectorAll('.h-1\\.5');
      expect(bars).toHaveLength(4);
      expect(bars[0]).toHaveClass('bg-red-500');
      expect(bars[1]).toHaveClass('bg-gray-200');
      expect(bars[2]).toHaveClass('bg-gray-200');
      expect(bars[3]).toHaveClass('bg-gray-200');
    });

    it('fills 2 bars when 2 criteria are met', () => {
      const { container } = render(<PasswordStrength password="Abcdefgh" />);
      const bars = container.querySelectorAll('.h-1\\.5');
      expect(bars[0]).toHaveClass('bg-orange-500');
      expect(bars[1]).toHaveClass('bg-orange-500');
      expect(bars[2]).toHaveClass('bg-gray-200');
      expect(bars[3]).toHaveClass('bg-gray-200');
    });

    it('fills 3 bars when 3 criteria are met', () => {
      const { container } = render(<PasswordStrength password="Abcdefg1" />);
      const bars = container.querySelectorAll('.h-1\\.5');
      expect(bars[0]).toHaveClass('bg-yellow-500');
      expect(bars[1]).toHaveClass('bg-yellow-500');
      expect(bars[2]).toHaveClass('bg-yellow-500');
      expect(bars[3]).toHaveClass('bg-gray-200');
    });

    it('fills all 4 bars when all criteria are met', () => {
      const { container } = render(<PasswordStrength password="Abcdef1!" />);
      const bars = container.querySelectorAll('.h-1\\.5');
      expect(bars[0]).toHaveClass('bg-green-500');
      expect(bars[1]).toHaveClass('bg-green-500');
      expect(bars[2]).toHaveClass('bg-green-500');
      expect(bars[3]).toHaveClass('bg-green-500');
    });
  });

  describe('Criteria checklist', () => {
    it('shows check marks for passed criteria', () => {
      const { container } = render(<PasswordStrength password="Abcdefg1!" />);
      const svgs = container.querySelectorAll('svg');

      // All 4 criteria should have check marks (path with "M5 13l4 4L19 7")
      const checkMarks = Array.from(svgs).filter((svg) => {
        const path = svg.querySelector('path');
        return path?.getAttribute('d') === 'M5 13l4 4L19 7';
      });

      expect(checkMarks).toHaveLength(4);
    });

    it('shows X marks for failed criteria', () => {
      const { container } = render(<PasswordStrength password="a" />); // All fail except none
      const svgs = container.querySelectorAll('svg');

      // All 4 criteria should have X marks (path with "M6 18L18 6M6 6l12 12")
      const xMarks = Array.from(svgs).filter((svg) => {
        const path = svg.querySelector('path');
        return path?.getAttribute('d') === 'M6 18L18 6M6 6l12 12';
      });

      expect(xMarks).toHaveLength(4);
    });

    it('shows mixed check and X marks based on criteria', () => {
      const { container } = render(<PasswordStrength password="Abcdefgh" />); // Length + uppercase pass
      const svgs = container.querySelectorAll('svg');

      const checkMarks = Array.from(svgs).filter((svg) => {
        const path = svg.querySelector('path');
        return path?.getAttribute('d') === 'M5 13l4 4L19 7';
      });

      const xMarks = Array.from(svgs).filter((svg) => {
        const path = svg.querySelector('path');
        return path?.getAttribute('d') === 'M6 18L18 6M6 6l12 12';
      });

      expect(checkMarks).toHaveLength(2); // Length and uppercase
      expect(xMarks).toHaveLength(2); // Number and special char
    });
  });

  describe('Individual criteria validation', () => {
    it('validates minimum length (8+ characters)', () => {
      const { rerender } = render(<PasswordStrength password="abcdefg" />);
      expect(screen.queryByText('อ่อน')).not.toBeInTheDocument(); // 0 criteria (only 7 chars, no numbers)

      rerender(<PasswordStrength password="abcdefgh" />);
      expect(screen.getByText('อ่อน')).toBeInTheDocument(); // 1 criterion (8+ chars)
    });

    it('validates uppercase letters', () => {
      render(<PasswordStrength password="abcdefghA" />);
      const items = screen.getByText('มีตัวพิมพ์ใหญ่').closest('li');
      expect(items).toHaveClass('text-green-600');
    });

    it('validates numbers', () => {
      render(<PasswordStrength password="abcdefgh1" />);
      const items = screen.getByText('มีตัวเลข').closest('li');
      expect(items).toHaveClass('text-green-600');
    });

    it('validates special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ',', '.', '?', '"', ':', '{', '}', '|', '<', '>'];

      specialChars.forEach((char) => {
        const { unmount } = render(<PasswordStrength password={`abcdefgh${char}`} />);
        const items = screen.getByText('มีอักขระพิเศษ').closest('li');
        expect(items).toHaveClass('text-green-600');
        unmount();
      });
    });
  });

  describe('Edge cases', () => {
    it('handles password with only spaces', () => {
      render(<PasswordStrength password="        " />); // 8 spaces
      expect(screen.getByText('อ่อน')).toBeInTheDocument(); // Only length passes
    });

    it('handles very long passwords', () => {
      const longPassword = 'A'.repeat(100) + '1!';
      render(<PasswordStrength password={longPassword} />);
      expect(screen.getByText('แข็งแกร่ง')).toBeInTheDocument();
    });

    it('handles Unicode characters', () => {
      render(<PasswordStrength password="สวัสดี123A!" />);
      expect(screen.getByText('แข็งแกร่ง')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<PasswordStrength password="test" className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies correct color classes for each strength level', () => {
      const tests = [
        { password: 'abcdefgh', color: 'bg-red-500' }, // Weak
        { password: 'Abcdefgh', color: 'bg-orange-500' }, // Fair
        { password: 'Abcdefg1', color: 'bg-yellow-500' }, // Good
        { password: 'Abcdef1!', color: 'bg-green-500' }, // Strong
      ];

      tests.forEach(({ password, color }) => {
        const { container, unmount } = render(<PasswordStrength password={password} />);
        const firstBar = container.querySelector('.h-1\\.5');
        expect(firstBar).toHaveClass(color);
        unmount();
      });
    });
  });
});

describe('isPasswordStrong utility function', () => {
  it('returns false for empty password', () => {
    expect(isPasswordStrong('')).toBe(false);
  });

  it('returns false when password is too short', () => {
    expect(isPasswordStrong('Abc123')).toBe(false); // Only 6 chars
  });

  it('returns false when password lacks uppercase', () => {
    expect(isPasswordStrong('abcdefg123')).toBe(false);
  });

  it('returns false when password lacks number', () => {
    expect(isPasswordStrong('Abcdefgh')).toBe(false);
  });

  it('returns true when password meets minimum requirements', () => {
    expect(isPasswordStrong('Abcdefg1')).toBe(true); // 8+ chars, uppercase, number
  });

  it('returns true even without special characters', () => {
    expect(isPasswordStrong('Password123')).toBe(true);
  });

  it('returns true with all criteria including special characters', () => {
    expect(isPasswordStrong('Password123!')).toBe(true);
  });
});
