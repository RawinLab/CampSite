import { render, screen, fireEvent } from '@testing-library/react';
import { PriceFilter } from '@/components/search/PriceFilter';
import { PRICE_CONSTANTS } from '@campsite/shared';

describe('PriceFilter Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders dual slider with min and max values', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);

    const minSlider = screen.getByLabelText('ราคาต่ำสุด');
    const maxSlider = screen.getByLabelText('ราคาสูงสุด');

    expect(minSlider).toBeInTheDocument();
    expect(maxSlider).toBeInTheDocument();
    expect(minSlider).toHaveValue('0');
    expect(maxSlider).toHaveValue('10000');
  });

  it('displays current price values in Thai Baht format', () => {
    render(
      <PriceFilter
        minPrice={500}
        maxPrice={2000}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('฿500')).toBeInTheDocument();
    expect(screen.getByText('฿2,000')).toBeInTheDocument();
  });

  it('slider range is 0 to 10000', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const minSlider = screen.getByLabelText('ราคาต่ำสุด');
    const maxSlider = screen.getByLabelText('ราคาสูงสุด');

    expect(minSlider).toHaveAttribute('min', String(PRICE_CONSTANTS.MIN));
    expect(minSlider).toHaveAttribute('max', String(PRICE_CONSTANTS.MAX));
    expect(maxSlider).toHaveAttribute('min', String(PRICE_CONSTANTS.MIN));
    expect(maxSlider).toHaveAttribute('max', String(PRICE_CONSTANTS.MAX));
  });

  it('min slider cannot exceed max slider', () => {
    render(
      <PriceFilter
        minPrice={1000}
        maxPrice={2000}
        onChange={mockOnChange}
      />
    );

    const minSlider = screen.getByLabelText('ราคาต่ำสุด');

    // Try to set min higher than max
    fireEvent.change(minSlider, { target: { value: '2500' } });

    // Should be capped at max value (may appear multiple times in UI)
    expect(screen.getAllByText('฿2,000').length).toBeGreaterThan(0);
    expect(minSlider).toHaveValue('2000');
  });

  it('max slider cannot go below min slider', () => {
    render(
      <PriceFilter
        minPrice={1000}
        maxPrice={2000}
        onChange={mockOnChange}
      />
    );

    const maxSlider = screen.getByLabelText('ราคาสูงสุด');

    // Try to set max lower than min
    fireEvent.change(maxSlider, { target: { value: '500' } });

    // Should be capped at min value (may appear multiple times in UI)
    expect(screen.getAllByText('฿1,000').length).toBeGreaterThan(0);
    expect(maxSlider).toHaveValue('1000');
  });

  it('onChange callback fires with new values on mouseup', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const minSlider = screen.getByLabelText('ราคาต่ำสุด');

    fireEvent.change(minSlider, { target: { value: '500' } });
    fireEvent.mouseUp(minSlider);

    expect(mockOnChange).toHaveBeenCalledWith(500, 10000);
  });

  it('onChange callback fires with new values on touchend', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const maxSlider = screen.getByLabelText('ราคาสูงสุด');

    fireEvent.change(maxSlider, { target: { value: '5000' } });
    fireEvent.touchEnd(maxSlider);

    expect(mockOnChange).toHaveBeenCalledWith(0, 5000);
  });

  it('quick preset button "ต่ำกว่า ฿500" works', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const budgetButton = screen.getByText('ต่ำกว่า ฿500');
    fireEvent.click(budgetButton);

    expect(mockOnChange).toHaveBeenCalledWith(0, 500);
    expect(screen.getByText('฿500')).toBeInTheDocument();
  });

  it('quick preset button "฿500-1,000" works', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const budgetButton = screen.getByText('฿500-1,000');
    fireEvent.click(budgetButton);

    expect(mockOnChange).toHaveBeenCalledWith(500, 1000);
    expect(screen.getByText('฿500')).toBeInTheDocument();
    expect(screen.getByText('฿1,000')).toBeInTheDocument();
  });

  it('quick preset button "฿1,000-2,000" works', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const midRangeButton = screen.getByText('฿1,000-2,000');
    fireEvent.click(midRangeButton);

    expect(mockOnChange).toHaveBeenCalledWith(1000, 2000);
    expect(screen.getByText('฿1,000')).toBeInTheDocument();
    expect(screen.getByText('฿2,000')).toBeInTheDocument();
  });

  it('quick preset button "มากกว่า ฿2,000" works', () => {
    render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    const luxuryButton = screen.getByText('มากกว่า ฿2,000');
    fireEvent.click(luxuryButton);

    expect(mockOnChange).toHaveBeenCalledWith(2000, 10000);
    expect(screen.getByText('฿2,000')).toBeInTheDocument();
    expect(screen.getByText('฿10,000')).toBeInTheDocument();
  });

  it('preset button is highlighted when active', () => {
    render(
      <PriceFilter
        minPrice={500}
        maxPrice={1000}
        onChange={mockOnChange}
      />
    );

    const activeButton = screen.getByText('฿500-1,000');
    expect(activeButton).toHaveClass('bg-green-500', 'text-white');
  });

  it('reset button appears when values are not default', () => {
    render(
      <PriceFilter
        minPrice={500}
        maxPrice={2000}
        onChange={mockOnChange}
      />
    );

    const resetButton = screen.getByText('รีเซ็ต');
    expect(resetButton).toBeInTheDocument();
  });

  it('reset button does not appear when values are default', () => {
    render(
      <PriceFilter
        minPrice={PRICE_CONSTANTS.DEFAULT_MIN}
        maxPrice={PRICE_CONSTANTS.DEFAULT_MAX}
        onChange={mockOnChange}
      />
    );

    const resetButton = screen.queryByText('รีเซ็ต');
    expect(resetButton).not.toBeInTheDocument();
  });

  it('reset button clears to default values', () => {
    render(
      <PriceFilter
        minPrice={500}
        maxPrice={2000}
        onChange={mockOnChange}
      />
    );

    const resetButton = screen.getByText('รีเซ็ต');
    fireEvent.click(resetButton);

    expect(mockOnChange).toHaveBeenCalledWith(
      PRICE_CONSTANTS.DEFAULT_MIN,
      PRICE_CONSTANTS.DEFAULT_MAX
    );
    expect(screen.getByText('฿0')).toBeInTheDocument();
    expect(screen.getByText('฿10,000')).toBeInTheDocument();
  });

  it('syncs local state with prop changes', () => {
    const { rerender } = render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('฿0')).toBeInTheDocument();
    expect(screen.getByText('฿10,000')).toBeInTheDocument();

    rerender(
      <PriceFilter
        minPrice={1000}
        maxPrice={5000}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('฿1,000')).toBeInTheDocument();
    expect(screen.getByText('฿5,000')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PriceFilter
        minPrice={0}
        maxPrice={10000}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('renders Thai Baht currency symbol', () => {
    render(
      <PriceFilter
        minPrice={1000}
        maxPrice={2000}
        onChange={mockOnChange}
      />
    );

    const priceElements = screen.getAllByText(/฿/);
    expect(priceElements.length).toBeGreaterThan(0);
  });
});
