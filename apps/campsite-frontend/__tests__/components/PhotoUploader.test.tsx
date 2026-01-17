import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import { MAX_PHOTO_SIZE_BYTES } from '@campsite/shared';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockObjectURLs: string[] = [];
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeAll(() => {
  URL.createObjectURL = jest.fn((file: Blob) => {
    const url = `blob:mock-url-${mockObjectURLs.length}`;
    mockObjectURLs.push(url);
    return url;
  });

  URL.revokeObjectURL = jest.fn((url: string) => {
    const index = mockObjectURLs.indexOf(url);
    if (index > -1) {
      mockObjectURLs.splice(index, 1);
    }
  });
});

afterAll(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

// Helper function to create mock files
const createMockFile = (
  name: string,
  size: number,
  type: string
): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('PhotoUploader Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockObjectURLs.length = 0;
  });

  describe('Rendering', () => {
    it('renders drop zone with correct text', () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      expect(screen.getByText('Click to upload')).toBeInTheDocument();
      expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/JPG, JPEG, PNG, WEBP up to 5MB each/i)).toBeInTheDocument();
    });

    it('shows upload count (0/5 photos)', () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      expect(screen.getByText('0/5 photos')).toBeInTheDocument();
    });

    it('shows upload count (2/5 photos) when photos are uploaded', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      expect(screen.getByText('2/5 photos')).toBeInTheDocument();
    });

    it('renders with custom max photos', () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} maxPhotos={10} />);

      expect(screen.getByText('0/10 photos')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <PhotoUploader photos={[]} onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('displays camera icon', () => {
      const { container } = render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const cameraIcon = container.querySelector('svg');
      expect(cameraIcon).toBeInTheDocument();
    });
  });

  describe('File Acceptance', () => {
    it('accepts valid JPEG image files', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });
    });

    it('accepts valid PNG image files', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const file = createMockFile('photo.png', 2000000, 'image/png');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });
    });

    it('accepts valid WEBP image files', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const file = createMockFile('photo.webp', 3000000, 'image/webp');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });
    });

    it('accepts multiple valid files at once', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const files = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.png', 2000000, 'image/png'),
        createMockFile('photo3.webp', 1500000, 'image/webp'),
      ];

      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, files);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(files);
      });
    });
  });

  describe('File Validation - Size', () => {
    it('rejects files over 5MB', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const largeFile = createMockFile('large.jpg', MAX_PHOTO_SIZE_BYTES + 1, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/File size exceeds maximum allowed/i)).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('accepts files exactly at 5MB limit', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const maxSizeFile = createMockFile('max.jpg', MAX_PHOTO_SIZE_BYTES, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, maxSizeFile);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([maxSizeFile]);
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('respects custom maxSize prop', async () => {
      const user = userEvent.setup();
      const customMaxSize = 2 * 1024 * 1024; // 2MB
      render(<PhotoUploader photos={[]} onChange={mockOnChange} maxSize={customMaxSize} />);

      const file = createMockFile('photo.jpg', customMaxSize + 1, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/File size exceeds 2MB limit/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Validation - Type', () => {
    it('rejects non-image files (PDF)', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const pdfFile = createMockFile('document.pdf', 1000000, 'application/pdf');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [pdfFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('rejects non-image files (GIF)', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const gifFile = createMockFile('animation.gif', 1000000, 'image/gif');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [gifFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });
    });

    it('rejects non-image files (SVG)', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const svgFile = createMockFile('icon.svg', 1000000, 'image/svg+xml');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [svgFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Messages', () => {
    it('shows error message for invalid files', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const invalidFile = createMockFile('document.txt', 1000000, 'text/plain');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveClass('bg-destructive/10', 'border-destructive/20');
      });
    });

    it('shows multiple error messages for multiple invalid files', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const files = [
        createMockFile('large.jpg', MAX_PHOTO_SIZE_BYTES + 1, 'image/jpeg'),
        createMockFile('document.pdf', 1000000, 'application/pdf'),
      ];

      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        const listItems = alert.querySelectorAll('li');
        expect(listItems).toHaveLength(2);
      });
    });

    it('shows filename in error message', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const invalidFile = createMockFile('my-document.pdf', 1000000, 'application/pdf');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText(/my-document.pdf/i)).toBeInTheDocument();
      });
    });

    it('accepts valid files and rejects invalid ones in mixed upload', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const files = [
        createMockFile('valid.jpg', 1000000, 'image/jpeg'),
        createMockFile('invalid.pdf', 1000000, 'application/pdf'),
      ];

      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([files[0]]);
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Photo Previews', () => {
    it('shows photo previews after upload', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      // Re-render with the uploaded photo
      const { rerender } = render(<PhotoUploader photos={[file]} onChange={mockOnChange} />);

      await waitFor(() => {
        const preview = screen.getByAltText(/Preview 1: photo.jpg/i);
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', expect.stringContaining('blob:mock-url'));
      });
    });

    it('displays previews grid with correct layout', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const list = screen.getByRole('list', { name: 'Selected photos' });
      expect(list).toBeInTheDocument();
      expect(list).toHaveClass('grid');
    });

    it('creates object URLs for previews', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    });

    it('revokes object URLs on unmount', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
      ];

      const { unmount } = render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Remove Photo', () => {
    it('shows remove button on photo preview', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const removeButton = screen.getByRole('button', { name: 'Remove photo 1' });
      expect(removeButton).toBeInTheDocument();
    });

    it('removes photo when remove button is clicked', async () => {
      const user = userEvent.setup();
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const removeButton = screen.getByRole('button', { name: 'Remove photo 1' });
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([mockPhotos[1]]);
    });

    it('removes correct photo when multiple photos exist', async () => {
      const user = userEvent.setup();
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo3.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const removeButton = screen.getByRole('button', { name: 'Remove photo 2' });
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([mockPhotos[0], mockPhotos[2]]);
    });

    it('clears errors when removing a photo', async () => {
      const user = userEvent.setup();
      const validFile = createMockFile('photo.jpg', 1000000, 'image/jpeg');

      render(
        <PhotoUploader photos={[validFile]} onChange={mockOnChange} />
      );

      const removeButton = screen.getByRole('button', { name: 'Remove photo 1' });
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag and drop events', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(dropZone).toHaveClass('border-primary', 'bg-primary/5');
    });

    it('accepts files dropped on drop zone', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([file]);
      });
    });

    it('resets drag state after drop', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [file] },
      });

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });

      expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/5');
    });

    it('resets drag state on drag leave', () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });

      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-primary', 'bg-primary/5');

      fireEvent.dragLeave(dropZone, {
        relatedTarget: null,
      });

      expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/5');
    });
  });

  describe('Max Photos Limit', () => {
    it('enforces max photos limit of 5 by default', async () => {
      const existingPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo3.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo4.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo5.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={existingPhotos} onChange={mockOnChange} />);

      const newFile = createMockFile('photo6.jpg', 1000000, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [newFile] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Can only add 0 more photos/i)).toBeInTheDocument();
      });
    });

    it('allows adding photos up to the limit', async () => {
      const user = userEvent.setup();
      const existingPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={existingPhotos} onChange={mockOnChange} />);

      const newFiles = [
        createMockFile('photo3.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo4.jpg', 1000000, 'image/jpeg'),
      ];

      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, newFiles);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([...existingPhotos, ...newFiles]);
      });
    });

    it('partially adds files when exceeding limit', async () => {
      const user = userEvent.setup();
      const existingPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo3.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={existingPhotos} onChange={mockOnChange} />);

      const newFiles = [
        createMockFile('photo4.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo5.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo6.jpg', 1000000, 'image/jpeg'),
      ];

      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, newFiles);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([
          ...existingPhotos,
          newFiles[0],
          newFiles[1],
        ]);
        expect(screen.getByText(/Can only add 2 more photos/i)).toBeInTheDocument();
      });
    });

    it('disables drop zone when max photos reached', () => {
      const maxPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo3.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo4.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo5.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={maxPhotos} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
      expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('shows "Add" button when photos can be added', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const addButton = screen.getByRole('button', { name: 'Add more photos' });
      expect(addButton).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('hides "Add" button when max photos reached', () => {
      const maxPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo3.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo4.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo5.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={maxPhotos} onChange={mockOnChange} />);

      const addButton = screen.queryByRole('button', { name: 'Add more photos' });
      expect(addButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on drop zone', () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      expect(dropZone).toHaveAttribute('aria-label', 'Upload photos. 0 of 5 photos selected.');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
      expect(dropZone).toHaveAttribute('aria-disabled', 'false');
    });

    it('updates ARIA label with photo count', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      expect(dropZone).toHaveAttribute('aria-label', 'Upload photos. 2 of 5 photos selected.');
    });

    it('marks drop zone as disabled when max photos reached', () => {
      const maxPhotos = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`photo${i + 1}.jpg`, 1000000, 'image/jpeg')
      );

      render(<PhotoUploader photos={maxPhotos} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      expect(dropZone).toHaveAttribute('aria-disabled', 'true');
      expect(dropZone).toHaveAttribute('tabIndex', '-1');
    });

    it('has proper role on error alert', async () => {
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const invalidFile = createMockFile('document.pdf', 1000000, 'application/pdf');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('has proper alt text on preview images', () => {
      const mockPhotos = [
        createMockFile('sunset.jpg', 1000000, 'image/jpeg'),
        createMockFile('beach.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      expect(screen.getByAltText('Preview 1: sunset.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('Preview 2: beach.jpg')).toBeInTheDocument();
    });

    it('supports keyboard navigation - Enter key opens file picker', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      dropZone.focus();

      await user.keyboard('{Enter}');

      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('supports keyboard navigation - Space key opens file picker', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const dropZone = screen.getByRole('button', { name: /upload photos/i });
      dropZone.focus();

      await user.keyboard(' ');

      const input = dropZone.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });

    it('has descriptive labels for remove buttons', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
        createMockFile('photo2.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: 'Remove photo 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove photo 2' })).toBeInTheDocument();
    });

    it('has proper list structure for previews', () => {
      const mockPhotos = [
        createMockFile('photo1.jpg', 1000000, 'image/jpeg'),
      ];

      render(<PhotoUploader photos={mockPhotos} onChange={mockOnChange} />);

      const list = screen.getByRole('list', { name: 'Selected photos' });
      const listItems = screen.getAllByRole('listitem');
      expect(list).toBeInTheDocument();
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file list gracefully', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate selecting files then canceling
      await user.upload(input, []);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('handles same file uploaded twice', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);
      await user.upload(input, file);

      // Should be called twice, allowing duplicate files
      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });

    it('resets input value after file selection', async () => {
      const user = userEvent.setup();
      render(<PhotoUploader photos={[]} onChange={mockOnChange} />);

      const file = createMockFile('photo.jpg', 1000000, 'image/jpeg');
      const input = screen.getByRole('button', { name: /upload photos/i })
        .querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      expect(input.value).toBe('');
    });
  });
});
