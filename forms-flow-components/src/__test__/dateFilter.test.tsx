import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateRangePicker } from '../components/CustomComponents/DateFilter';
import '@testing-library/jest-dom';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'January': 'January',
        'February': 'February',
        'March': 'March',
        'April': 'April',
        'May': 'May',
        'June': 'June',
        'July': 'July',
        'August': 'August',
        'September': 'September',
        'October': 'October',
        'November': 'November',
        'December': 'December',
        'MO': 'MO',
        'TU': 'TU',
        'WE': 'WE',
        'TH': 'TH',
        'FR': 'FR',
        'SA': 'SA',
        'SU': 'SU',
        'Date range selector': 'Date range selector',
        'Close calendar': 'Close calendar',
        'Date picker': 'Date picker',
        'Previous year': 'Previous year',
        'Previous month': 'Previous month',
        'Next month': 'Next month',
        'Next year': 'Next year',
        'Day of week': 'Day of week',
        'selected': 'selected',
        'not selected': 'not selected'
      };
      return translations[key] || key;
    }
  })
}));

// Mock SVG icons
jest.mock('../components/SvgIcons', () => ({
  AngleLeftIcon: () => <div data-testid="angle-left-icon">←</div>,
  AngleRightIcon: () => <div data-testid="angle-right-icon">→</div>,
  CloseIcon: ({ onClick }: { onClick?: (e: React.MouseEvent) => void, color: string }) => 
    <div data-testid="close-icon" onClick={onClick}>×</div>,
  RightFarIcon: () => <div data-testid="right-far-icon">⟫</div>,
  LeftFarIcon: () => <div data-testid="left-far-icon">⟪</div>,
  DownArrowIcon: () => <div data-testid="down-arrow-icon">▼</div>,
  UpArrowIcon: () => <div data-testid="up-arrow-icon">▲</div>,
}));

describe('DateRangePicker Component', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to format dates in MM/DD/YYYY format
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  test('renders with default values', () => {
    render(<DateRangePicker />);
    
    // Check if the component renders
    const dateRangePicker = screen.getByTestId('date-range-picker');
    expect(dateRangePicker).toBeInTheDocument();
    
    // Check if the default date format is displayed
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const expectedDateText = `${formatDate(today)} - ${formatDate(thirtyDaysLater)}`;
    const dateRangeText = screen.getByTestId('date-range-text');
    
    expect(dateRangeText.textContent).toBe(expectedDateText);
  });

  test('renders with custom initial date range', () => {
    const initialDateRange = {
      startDate: new Date(2025, 0, 1), // Jan 1, 2025
      endDate: new Date(2025, 0, 15)   // Jan 15, 2025
    };
    
    render(<DateRangePicker initialDateRange={initialDateRange} />);
    
    const expectedDateText = `01/01/2025 - 01/15/2025`;
    const dateRangeText = screen.getByTestId('date-range-text');
    
    expect(dateRangeText.textContent).toBe(expectedDateText);
  });

  test('opens and closes calendar', () => {
    render(<DateRangePicker />);
    
    // Calendar should be closed initially
    expect(screen.queryByTestId('calendar-container')).not.toBeInTheDocument();
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
    
    // Close calendar
    fireEvent.click(screen.getByTestId('date-range-close-btn'));
    expect(screen.queryByTestId('calendar-container')).not.toBeInTheDocument();
  });

  test('displays correct month and year in calendar header', () => {
    const initialDateRange = {
      startDate: new Date(2025, 2, 15), // Mar 15, 2025
      endDate: new Date(2025, 2, 20)    // Mar 20, 2025
    };
    
    render(<DateRangePicker initialDateRange={initialDateRange} />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Check if correct month and year are displayed
    const monthYearText = screen.getByTestId('calendar-month-year');
    expect(monthYearText.textContent).toBe('March 2025');
  });

 

  test('navigates to previous and next year', () => {
    const initialDateRange = {
      startDate: new Date(2025, 2, 15), // Mar 15, 2025
      endDate: new Date(2025, 2, 20)    // Mar 20, 2025
    };
    
    render(<DateRangePicker initialDateRange={initialDateRange} />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Initial year
    expect(screen.getByTestId('calendar-month-year').textContent).toBe('March 2025');
    
    // Go to next year
    fireEvent.click(screen.getByTestId('right-far-icon'));
    expect(screen.getByTestId('calendar-month-year').textContent).toBe('March 2026');
    
    // Go to previous year
    fireEvent.click(screen.getByTestId('left-far-icon'));
    expect(screen.getByTestId('calendar-month-year').textContent).toBe('March 2025');
  });

  test('selects date range and calls onChange', async () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Find and select a start date (15th of current month)
    const startDateElement = screen.getByTestId('calendar-day-15');
    fireEvent.click(startDateElement);
    
    // Find and select an end date (20th of current month)
    const endDateElement = screen.getByTestId('calendar-day-20');
    fireEvent.click(endDateElement);
    
    // Check if onChange was called with the correct date range
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const onChangeCalls = mockOnChange.mock.calls[0][0];
    
    // Get the current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Create expected date objects
    const expectedStartDate = new Date(currentYear, currentMonth, 15);
    const expectedEndDate = new Date(currentYear, currentMonth, 20);
    
    // Check that the dates match (comparing by time to avoid timezone issues)
    expect(onChangeCalls.startDate.getTime()).toBe(expectedStartDate.getTime());
    expect(onChangeCalls.endDate.getTime()).toBe(expectedEndDate.getTime());
    
    // Check if the display text was updated
    await waitFor(() => {
      const expectedText = `${formatDate(expectedStartDate)} - ${formatDate(expectedEndDate)}`;
      expect(screen.getByTestId('date-range-text').textContent).toBe(expectedText);
    });
  });
  
  test('handles keyboard navigation', () => {
    render(<DateRangePicker />);
    
    // Open calendar with keyboard
    const dateRangeDisplay = screen.getByTestId('date-range-display');
    fireEvent.keyDown(dateRangeDisplay, { key: 'Enter' });
    expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
    
    // Navigate to next month with keyboard
    const nextMonthBtn = screen.getByTestId('calendar-next-month');
    fireEvent.keyDown(nextMonthBtn, { key: 'Enter' });
    
    // Navigate to previous month with keyboard
    const prevMonthBtn = screen.getByTestId('calendar-prev-month');
    fireEvent.keyDown(prevMonthBtn, { key: 'Enter' });
    
    // Select a date with keyboard
    const dayElement = screen.getByTestId('calendar-day-15');
    fireEvent.keyDown(dayElement, { key: 'Enter' });
    
    // Close calendar with keyboard
    const closeBtn = screen.getByTestId('date-range-close-btn');
    fireEvent.keyDown(closeBtn, { key: 'Enter' });
    expect(screen.queryByTestId('calendar-container')).not.toBeInTheDocument();
  });

  test('properly marks selected date range', () => {
    render(<DateRangePicker />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Select start date (10th)
    const startDateElement = screen.getByTestId('calendar-day-10');
    fireEvent.click(startDateElement);
    
    // Select end date (20th)
    const endDateElement = screen.getByTestId('calendar-day-20');
    fireEvent.click(endDateElement);
    
    // Reopen calendar to check selection
    fireEvent.click(screen.getByTestId('date-range-display'));
    
  });

  test('handles string dates in initialDateRange', () => {
    const initialDateRange = {
      startDate: '2025-01-01T00:00:00.000Z', // ISO string for Jan 1, 2025
      endDate: '2025-01-15T00:00:00.000Z'    // ISO string for Jan 15, 2025
    };
    
    render(<DateRangePicker initialDateRange={initialDateRange} />);
    
    const dateRangeText = screen.getByTestId('date-range-text');
    expect(dateRangeText.textContent).toBe('01/01/2025 - 01/15/2025');
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    expect(screen.getByTestId('calendar-month-year').textContent).toBe('January 2025');
  });

  test('resets to initial range when calendar is closed without selection', () => {
    const initialDateRange = {
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 0, 15)
    };
    
    render(<DateRangePicker initialDateRange={initialDateRange} />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Select only start date
    const startDateElement = screen.getByTestId('calendar-day-10');
    fireEvent.click(startDateElement);
    
    // Close calendar without selecting end date
    fireEvent.click(screen.getByTestId('date-range-close-btn'));
    
    // Date range should reset to initial
    const dateRangeText = screen.getByTestId('date-range-text');
    expect(dateRangeText.textContent).toBe('01/01/2025 - 01/15/2025');
  });

  test('handles selection when end date is before start date', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Select start date (20th)
    const startDateElement = screen.getByTestId('calendar-day-20');
    fireEvent.click(startDateElement);
    
    // Select end date (10th) which is before start date
    const endDateElement = screen.getByTestId('calendar-day-10');
    fireEvent.click(endDateElement);
    
    // Check if onChange was called with correct order (10th to 20th)
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const onChangeCalls = mockOnChange.mock.calls[0][0];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const expectedStartDate = new Date(currentYear, currentMonth, 10);
    const expectedEndDate = new Date(currentYear, currentMonth, 20);
    
    expect(onChangeCalls.startDate.getTime()).toBe(expectedStartDate.getTime());
    expect(onChangeCalls.endDate.getTime()).toBe(expectedEndDate.getTime());
  });

  test('applies custom className', () => {
    render(<DateRangePicker className="custom-class" />);
    
    const dateRangePicker = screen.getByTestId('date-range-picker');
    expect(dateRangePicker).toHaveClass('custom-class');
  });
});