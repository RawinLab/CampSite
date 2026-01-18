import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploader } from '@/components/ui/FileUploader';
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@campsite/shared';

// Mock URL.createObjectURL and URL.revokeObjectURL
let mockUrlCounter = 0;
global.URL.createObjectURL = jest.fn(() => `mock-object-url-${++mockUrlCounter}`);
global.URL.revokeObjectURL = jest.fn();

describe('FileUploader', () => {
  const mockOnUpload = jest.fn();

  // Helper function to create mock files
  const createMockFile = (
    name: string,
    size: number,
    type: string
  ): File => {
    const file = new File(['a'.repeat(size)], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUrlCounter = 0;
    (global.URL.createObjectURL as jest.Mock).mockClear();
    (global.URL.revokeObjectURL as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('renders the file uploader component', () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    });

    it('displays correct file size limit in message', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      render(<FileUploader onUpload={mockOnUpload} maxSize={maxSize} />);

      expect(screen.getByText(/PNG, JPG, WebP up to 5MB/i)).toBeInTheDocument();
    });

    it('displays custom file size limit when provided', () => {
      const customMaxSize = 10 * 1024 * 1024; // 10MB
      render(<FileUploader onUpload={mockOnUpload} maxSize={customMaxSize} />);

      expect(screen.getByText(/PNG, JPG, WebP up to 10MB/i)).toBeInTheDocument();
    });

    it('renders drop zone with correct text', () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      expect(screen.getByText('Click to upload')).toBeInTheDocument();
      expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument();
    });

    it('renders with upload icon', () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);

      const uploadIcon = container.querySelector('svg');
      expect(uploadIcon).toBeInTheDocument();
    });
  });

  describe('File Selection via Click/Browse', () => {
    it('opens file input when drop zone is clicked', async () => {
      const user = userEvent.setup();
      render(<FileUploader onUpload={mockOnUpload} />);

      const dropZone = screen.getByText(/Click to upload/i).closest('div');
      expect(dropZone).toBeInTheDocument();

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('accepts multiple files when multiple prop is true', () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('does not accept multiple files when multiple prop is false', () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={false} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toHaveAttribute('multiple');
    });

    it('has correct accept attribute for image files', () => {
      render(<FileUploader onUpload={mockOnUpload} accept="image/*" />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('handles file selection and creates previews', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test-image.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    });

    it('handles multiple file selection', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const file1 = createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg');
      const file2 = createMockFile('image2.png', 2 * 1024 * 1024, 'image/png');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, [file1, file2]);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
        expect(screen.getByText('2 files selected')).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop File Handling', () => {
    it('handles drag over event', () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);
      const dropZone = screen.getByText(/Click to upload/i).closest('div') as HTMLElement;

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).toHaveClass('border-primary', 'bg-primary/5');
    });

    it('handles drag leave event', () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);
      const dropZone = screen.getByText(/Click to upload/i).closest('div') as HTMLElement;

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] },
      });
      expect(dropZone).toHaveClass('border-primary');

      fireEvent.dragLeave(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/5');
    });

    it('handles file drop', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);
      const dropZone = screen.getByText(/Click to upload/i).closest('div') as HTMLElement;

      const file = createMockFile('dropped-image.jpg', 1024 * 1024, 'image/jpeg');

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    });

    it('resets drag state after drop', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);
      const dropZone = screen.getByText(/Click to upload/i).closest('div') as HTMLElement;

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] },
      });

      const file = createMockFile('image.jpg', 1024 * 1024, 'image/jpeg');

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(dropZone).not.toHaveClass('border-primary', 'bg-primary/5');
      });
    });

    it('handles multiple files dropped at once', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);
      const dropZone = screen.getByText(/Click to upload/i).closest('div') as HTMLElement;

      const file1 = createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg');
      const file2 = createMockFile('image2.png', 2 * 1024 * 1024, 'image/png');
      const file3 = createMockFile('image3.webp', 1024 * 1024, 'image/webp');

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file1, file2, file3],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('3 files selected')).toBeInTheDocument();
      });
    });
  });

  describe('File Type Validation', () => {
    it('accepts valid JPEG image', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
      });
    });

    it('accepts valid PNG image', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.png', 1024 * 1024, 'image/png');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
      });
    });

    it('accepts valid WebP image', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.webp', 1024 * 1024, 'image/webp');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
      });
    });

    it('rejects non-image file types', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('document.pdf', 1024 * 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/document.pdf: Invalid file type/i)).toBeInTheDocument();
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
      });
    });

    it('rejects text files', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('file.txt', 1024, 'text/plain');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file.txt: Invalid file type/i)).toBeInTheDocument();
      });
    });

    it('displays error message with allowed types', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('video.mp4', 1024 * 1024, 'video/mp4');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type. Allowed types:/i)).toBeInTheDocument();
      });
    });

    it('accepts valid files and rejects invalid files simultaneously', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const validFile = createMockFile('valid.jpg', 1024 * 1024, 'image/jpeg');
      const invalidFile = createMockFile('invalid.pdf', 1024 * 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [validFile, invalidFile] } });

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.getByText(/invalid.pdf: Invalid file type/i)).toBeInTheDocument();
        expect(screen.getByText('1 file selected')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Validation', () => {
    it('accepts files within size limit', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxSize={5 * 1024 * 1024} />);

      const file = createMockFile('small-image.jpg', 2 * 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.queryByText(/File size exceeds/i)).not.toBeInTheDocument();
      });
    });

    it('rejects files exceeding 5MB limit', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxSize={5 * 1024 * 1024} />);

      const file = createMockFile('large-image.jpg', 6 * 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/large-image.jpg: File size exceeds maximum allowed/i)).toBeInTheDocument();
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
      });
    });

    it('displays correct size limit in error message', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxSize={5 * 1024 * 1024} />);

      const file = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        const errorText = screen.getByText(/large.jpg: File size exceeds maximum allowed/i);
        expect(errorText).toBeInTheDocument();
        expect(errorText.textContent).toContain('5MB');
      });
    });

    it('accepts file exactly at size limit', async () => {
      const maxSize = 5 * 1024 * 1024;
      render(<FileUploader onUpload={mockOnUpload} maxSize={maxSize} />);

      const file = createMockFile('exact-size.jpg', maxSize, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });
    });

    it('handles mixed valid and oversized files', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} maxSize={5 * 1024 * 1024} />);

      const validFile = createMockFile('valid.jpg', 2 * 1024 * 1024, 'image/jpeg');
      const oversizedFile = createMockFile('oversized.jpg', 10 * 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, [validFile, oversizedFile]);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.getByText(/oversized.jpg: File size exceeds/i)).toBeInTheDocument();
        expect(screen.getByText('1 file selected')).toBeInTheDocument();
      });
    });
  });

  describe('Max File Count Enforcement', () => {
    it('accepts files up to max limit', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxFiles={3} multiple={true} />);

      const files = [
        createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image2.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image3.jpg', 1024 * 1024, 'image/jpeg'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText('3 files selected')).toBeInTheDocument();
        expect(screen.queryByText(/Maximum.*files allowed/i)).not.toBeInTheDocument();
      });
    });

    it('enforces max file limit of 20 files', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxFiles={20} multiple={true} />);

      const files = Array.from({ length: 25 }, (_, i) =>
        createMockFile(`image${i + 1}.jpg`, 1024 * 1024, 'image/jpeg')
      );
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 20 files allowed at once/i)).toBeInTheDocument();
        expect(screen.getByText('20 files selected')).toBeInTheDocument();
      });
    });

    it('displays error when exceeding maxFiles limit', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxFiles={5} multiple={true} />);

      const files = Array.from({ length: 7 }, (_, i) =>
        createMockFile(`image${i + 1}.jpg`, 1024 * 1024, 'image/jpeg')
      );
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 5 files allowed at once/i)).toBeInTheDocument();
        expect(screen.getByText('5 files selected')).toBeInTheDocument();
      });
    });

    it('takes only first N files when limit exceeded', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxFiles={3} multiple={true} />);

      const files = [
        createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image2.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image3.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image4.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image5.jpg', 1024 * 1024, 'image/jpeg'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText('3 files selected')).toBeInTheDocument();
        expect(screen.getByText(/Maximum 3 files allowed at once/i)).toBeInTheDocument();
      });
    });

    it('respects default maxFiles of 10', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = Array.from({ length: 12 }, (_, i) =>
        createMockFile(`image${i + 1}.jpg`, 1024 * 1024, 'image/jpeg')
      );
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 10 files allowed at once/i)).toBeInTheDocument();
        expect(screen.getByText('10 files selected')).toBeInTheDocument();
      });
    });
  });

  describe('Preview Image Display', () => {
    it('displays preview for single uploaded file', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('preview-test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        const preview = screen.getByAltText('Preview 1');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', expect.stringContaining('mock-object-url'));
      });
    });

    it('displays multiple previews in grid layout', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = [
        createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image2.png', 1024 * 1024, 'image/png'),
        createMockFile('image3.webp', 1024 * 1024, 'image/webp'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
        expect(screen.getByAltText('Preview 2')).toBeInTheDocument();
        expect(screen.getByAltText('Preview 3')).toBeInTheDocument();
      });
    });

    it('previews are displayed in grid with correct classes', async () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = [
        createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image2.jpg', 1024 * 1024, 'image/jpeg'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        const grid = container.querySelector('.grid.grid-cols-4.gap-4');
        expect(grid).toBeInTheDocument();
      });
    });

    it('creates object URLs for file previews', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
      });
    });
  });

  describe('Upload Progress State', () => {
    it('shows upload button when files are selected', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload 1 Photo/i })).toBeInTheDocument();
      });
    });

    it('shows correct plural text for multiple files', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = [
        createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image2.jpg', 1024 * 1024, 'image/jpeg'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload 2 Photos/i })).toBeInTheDocument();
      });
    });

    it('displays uploading state during upload', async () => {
      mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });
    });

    it('disables upload button during upload', async () => {
      mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Uploading.../i });
        expect(button).toBeDisabled();
      });
    });

    it('shows loading spinner during upload', async () => {
      mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('calls onUpload with correct files', async () => {
      mockOnUpload.mockResolvedValue(undefined);
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith([file]);
      });
    });

    it('clears previews after successful upload', async () => {
      mockOnUpload.mockResolvedValue(undefined);
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Upload/i })).not.toBeInTheDocument();
      });
    });

    it('revokes object URLs after successful upload', async () => {
      mockOnUpload.mockResolvedValue(undefined);
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(expect.stringContaining('mock-object-url'));
      });
    });
  });

  describe('Error Message Display', () => {
    it('displays error message for invalid file type', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('invalid.txt', 1024, 'text/plain');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const errorContainer = screen.getByText(/invalid.txt: Invalid file type/i).closest('div');
        expect(errorContainer).toHaveClass('bg-destructive/10', 'border-destructive/20');
      });
    });

    it('displays multiple error messages', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = [
        createMockFile('invalid1.txt', 1024, 'text/plain'),
        createMockFile('invalid2.pdf', 1024, 'application/pdf'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText(/invalid1.txt: Invalid file type/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid2.pdf: Invalid file type/i)).toBeInTheDocument();
      });
    });

    it('displays error when upload fails', async () => {
      mockOnUpload.mockRejectedValue(new Error('Upload failed'));
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });

    it('clears errors before starting new upload', async () => {
      mockOnUpload.mockRejectedValueOnce(new Error('First error'));
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Upload again - errors should be cleared when upload starts
      mockOnUpload.mockResolvedValueOnce(undefined);
      const retryButton = screen.getByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('handles non-Error upload failures', async () => {
      mockOnUpload.mockRejectedValue('String error');
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });
  });

  describe('Remove File Functionality', () => {
    it('displays remove button for each preview', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        const removeButtons = screen.getAllByRole('button', { name: '' }).filter(
          btn => btn.querySelector('svg')
        );
        expect(removeButtons.length).toBeGreaterThan(0);
      });
    });

    it('removes file when remove button is clicked', async () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });

      const removeButton = container.querySelector('button.absolute.top-1.right-1') as HTMLButtonElement;
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
        expect(screen.queryByText('1 file selected')).not.toBeInTheDocument();
      });
    });

    it('revokes object URL when file is removed', async () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
      });

      (global.URL.revokeObjectURL as jest.Mock).mockClear();

      const removeButton = container.querySelector('button.absolute.top-1.right-1') as HTMLButtonElement;
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(expect.stringContaining('mock-object-url'));
      });
    });

    it('removes specific file from multiple previews', async () => {
      const { container } = render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = [
        createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image2.jpg', 1024 * 1024, 'image/jpeg'),
        createMockFile('image3.jpg', 1024 * 1024, 'image/jpeg'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText('3 files selected')).toBeInTheDocument();
      });

      const removeButtons = container.querySelectorAll('button.absolute.top-1.right-1');
      fireEvent.click(removeButtons[1] as HTMLButtonElement);

      await waitFor(() => {
        expect(screen.getByText('2 files selected')).toBeInTheDocument();
      });
    });

    it('disables remove button during upload', async () => {
      mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { container } = render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      const uploadButton = await screen.findByRole('button', { name: /Upload 1 Photo/i });
      fireEvent.click(uploadButton);

      await waitFor(() => {
        const removeButton = container.querySelector('button.absolute.top-1.right-1') as HTMLButtonElement;
        expect(removeButton).toBeDisabled();
      });
    });
  });

  describe('Multiple File Selection', () => {
    it('handles adding more files to existing selection', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const file1 = createMockFile('image1.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file1);

      await waitFor(() => {
        expect(screen.getByText('1 file selected')).toBeInTheDocument();
      });

      const file2 = createMockFile('image2.jpg', 1024 * 1024, 'image/jpeg');
      await userEvent.upload(fileInput, file2);

      await waitFor(() => {
        expect(screen.getByText('2 files selected')).toBeInTheDocument();
      });
    });

    it('displays correct file count text for single file', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('single.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText('1 file selected')).toBeInTheDocument();
      });
    });

    it('displays correct file count text for multiple files', async () => {
      render(<FileUploader onUpload={mockOnUpload} multiple={true} />);

      const files = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`image${i + 1}.jpg`, 1024 * 1024, 'image/jpeg')
      );
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText('5 files selected')).toBeInTheDocument();
      });
    });

    it('resets file input after selection', async () => {
      render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });

  describe('Disabled State', () => {
    it('disables file input when disabled prop is true', () => {
      render(<FileUploader onUpload={mockOnUpload} disabled={true} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDisabled();
    });

    it('applies disabled styling to drop zone', () => {
      render(<FileUploader onUpload={mockOnUpload} disabled={true} />);

      const dropZone = screen.getByText(/Click to upload/i).closest('div') as HTMLElement;
      expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not handle file selection when disabled', async () => {
      render(<FileUploader onUpload={mockOnUpload} disabled={true} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Try to upload (should not work)
      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.queryByAltText('Preview 1')).not.toBeInTheDocument();
      });
    });

    it('disables upload button when disabled prop is true', async () => {
      mockOnUpload.mockResolvedValue(undefined);
      const { rerender } = render(<FileUploader onUpload={mockOnUpload} />);

      const file = createMockFile('test.jpg', 1024 * 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload 1 Photo/i })).toBeInTheDocument();
      });

      rerender(<FileUploader onUpload={mockOnUpload} disabled={true} />);

      const uploadButton = screen.getByRole('button', { name: /Upload 1 Photo/i });
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FileUploader onUpload={mockOnUpload} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('uses custom accept attribute', () => {
      render(<FileUploader onUpload={mockOnUpload} accept=".jpg,.png" />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', '.jpg,.png');
    });

    it('uses custom maxSize value for display', async () => {
      const customMaxSize = 2 * 1024 * 1024; // 2MB
      render(<FileUploader onUpload={mockOnUpload} maxSize={customMaxSize} />);

      // Verify the UI shows the custom max size
      expect(screen.getByText(/PNG, JPG, WebP up to 2MB/i)).toBeInTheDocument();
    });

    it('uses custom maxFiles value', async () => {
      render(<FileUploader onUpload={mockOnUpload} maxFiles={2} multiple={true} />);

      const files = Array.from({ length: 4 }, (_, i) =>
        createMockFile(`image${i + 1}.jpg`, 1024 * 1024, 'image/jpeg')
      );
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(fileInput, files);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 2 files allowed at once/i)).toBeInTheDocument();
        expect(screen.getByText('2 files selected')).toBeInTheDocument();
      });
    });
  });
});
