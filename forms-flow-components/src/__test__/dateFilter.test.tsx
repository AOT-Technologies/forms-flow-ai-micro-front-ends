import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DateRangePicker } from '../components/CustomComponents/DateFilter';
import '@testing-library/jest-dom';

// Mock the translation function
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
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
        'not selected': 'not selected',
        'Showing': 'Showing',
        'to': 'to',
        'of': 'of',
        'Rows per page': 'Rows per page'
      };
      return translations[key] || key;
    }
  })
}));

// Mock SVG Icons
jest.mock('../components/SvgIcons', () => ({
  AngleLeftIcon: () => <div data-testid="angle-left-icon">AngleLeftIcon</div>,
  AngleRightIcon: () => <div data-testid="angle-right-icon">AngleRightIcon</div>,
  CloseIcon: () => <div data-testid="close-icon">CloseIcon</div>,
  RightFarIcon: () => <div data-testid="right-far-icon">RightFarIcon</div>,
  LeftFarIcon: () => <div data-testid="left-far-icon">LeftFarIcon</div>,
  DownArrowIcon: () => <div data-testid="down-arrow-icon">DownArrowIcon</div>,
  UpArrowIcon: () => <div data-testid="up-arrow-icon">UpArrowIcon</div>,
}));

describe('DateRangePicker Component', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('renders with default placeholder when no dates are selected', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('Select date range');
    expect(screen.getByTestId('down-arrow-icon')).toBeInTheDocument();
  });

  it('renders with custom placeholder when provided', () => {
    render(<DateRangePicker onChange={mockOnChange} placeholder="Custom placeholder" />);
    
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('Custom placeholder');
  });

  it('opens calendar when display is clicked', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    expect(screen.getByTestId('calendar-container')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-days-header')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-days')).toBeInTheDocument();
    expect(screen.getByTestId('up-arrow-icon')).toBeInTheDocument();
  });

  it('displays correct month and year in calendar header', () => {
    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();
    
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent(`${currentMonth} ${currentYear}`);
  });

  it('navigates to previous month when prev month button is clicked', () => {
    const today = new Date();
    const prevMonth = new Date(today);
    prevMonth.setMonth(today.getMonth() - 1);
    const prevMonthName = prevMonth.toLocaleString('default', { month: 'long' });
    const prevMonthYear = prevMonth.getFullYear();
    
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    fireEvent.click(screen.getByTestId('calendar-prev-month'));
    
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent(`${prevMonthName} ${prevMonthYear}`);
  });

  it('navigates to next month when next month button is clicked', () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleString('default', { month: 'long' });
    const nextMonthYear = nextMonth.getFullYear();
    
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    fireEvent.click(screen.getByTestId('calendar-next-month'));
    
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent(`${nextMonthName} ${nextMonthYear}`);
  });

  it('navigates to previous year when prev year button is clicked', () => {
    const today = new Date();
    const prevYear = today.getFullYear() - 1;
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    fireEvent.click(screen.getByTestId('calendar-prev-year'));
    
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent(`${currentMonth} ${prevYear}`);
  });

  it('navigates to next year when next year button is clicked', () => {
    const today = new Date();
    const nextYear = today.getFullYear() + 1;
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    fireEvent.click(screen.getByTestId('calendar-next-year'));
    
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent(`${currentMonth} ${nextYear}`);
  });

  it('selects a date range when two dates are clicked', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Find a valid day in the current month (e.g., the 10th)
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    
    // Select the first day and a day 5 days later
    const firstDay = calendarDays[10]; // arbitrary day in the middle of the month
    const secondDay = calendarDays[15]; // another day later in the month
    
    fireEvent.click(firstDay);
    fireEvent.click(secondDay);
    
    // Check that onChange was called with the correct date range
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    
    // First call should be with just the start date
    const firstCall = mockOnChange.mock.calls[0][0];
    expect(firstCall.startDate).toBeInstanceOf(Date);
    expect(firstCall.endDate).toBeNull();
    
    // Second call should be with both dates
    const secondCall = mockOnChange.mock.calls[1][0];
    expect(secondCall.startDate).toBeInstanceOf(Date);
    expect(secondCall.endDate).toBeInstanceOf(Date);
  });

  it('selects a date range in reverse order when second date is before first date', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Find days in the current month
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    
    // Select days in reverse order
    const laterDay = calendarDays[15];
    const earlierDay = calendarDays[10];
    
    fireEvent.click(laterDay);
    fireEvent.click(earlierDay);
    
    // Check that onChange was called with the correct date range
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    
    // Second call should have dates in correct order (start < end)
    const secondCall = mockOnChange.mock.calls[1][0];
    const startDate = new Date(secondCall.startDate);
    const endDate = new Date(secondCall.endDate);
    expect(startDate.getTime()).toBeLessThan(endDate.getTime());
  });

  it('clears date selection when close button is clicked', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Select a date
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    fireEvent.click(calendarDays[10]);
    
    // Click the close button
    fireEvent.click(screen.getByTestId('date-range-close-btn'));
    
    // Check that onChange was called with null dates
    expect(mockOnChange).toHaveBeenLastCalledWith({
      startDate: null,
      endDate: null
    });
    
    // Verify the calendar is closed
    expect(screen.queryByTestId('calendar-container')).not.toBeInTheDocument();
    
    // Verify the display shows the placeholder
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('Select date range');
  });

  it('supports keyboard navigation with Enter key', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    // Open calendar with Enter key
    const dateRangeDisplay = screen.getByTestId('date-range-display');
    fireEvent.keyDown(dateRangeDisplay, { key: 'Enter' });
    
    // Navigate to previous month with Enter key
    const prevMonthBtn = screen.getByTestId('calendar-prev-month');
    fireEvent.keyDown(prevMonthBtn, { key: 'Enter' });
    
    // Select a date with Enter key
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    fireEvent.keyDown(calendarDays[10], { key: 'Enter' });
    
    // Verify onChange was called
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('handles custom date format correctly', () => {
    const customFormat = "YYYY-MM-DD";
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        dateFormat={customFormat}
        value={{
          startDate: new Date(2023, 5, 10), // June 10, 2023
          endDate: new Date(2023, 5, 15)    // June 15, 2023
        }}
      />
    );
    
    // Expected format: YYYY-MM-DD - YYYY-MM-DD
    expect(screen.getByTestId('date-range-text').textContent).toBe('2023-06-10 - 2023-06-15');
  });

  it('initializes with provided date range', () => {
    const initialDateRange = {
      startDate: new Date(2023, 5, 10), // June 10, 2023
      endDate: new Date(2023, 5, 15)    // June 15, 2023
    };
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialDateRange}
        dateFormat="MM/DD/YYYY"
      />
    );
    
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('06/10/2023 - 06/15/2023');
    
    // Open calendar and verify it shows the correct month/year
    fireEvent.click(screen.getByTestId('date-range-display'));
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('June 2023');
  });

  it('handles ISO date strings in the value prop', () => {
    const initialDateRange = {
      startDate: '2023-06-10T00:00:00.000Z',
      endDate: '2023-06-15T00:00:00.000Z'
    };
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialDateRange}
        dateFormat="MM/DD/YYYY"
      />
    );
    
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('06/10/2023 - 06/15/2023');
    
    // Open calendar and verify it shows the correct month/year
    fireEvent.click(screen.getByTestId('date-range-display'));
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('June 2023');
  });

  it('updates when value prop changes', () => {
    const { rerender } = render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={{
          startDate: new Date(2023, 5, 10), // June 10, 2023
          endDate: new Date(2023, 5, 15)    // June 15, 2023
        }}
      />
    );
    
    // Update with new date range
    rerender(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={{
          startDate: new Date(2023, 7, 20), // August 20, 2023
          endDate: new Date(2023, 7, 25)    // August 25, 2023
        }}
      />
    );
    
    // Open calendar and verify it shows the updated month/year
    fireEvent.click(screen.getByTestId('date-range-display'));
    expect(screen.getByTestId('calendar-month-year')).toHaveTextContent('August 2023');
  });

  it('resets to empty range when value prop becomes null/undefined', () => {
    const { rerender } = render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={{
          startDate: new Date(2023, 5, 10),
          endDate: new Date(2023, 5, 15)
        }}
      />
    );
    
    // Update with undefined value
    rerender(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={undefined}
      />
    );
    
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('Select date range');
  });

  it('applies custom className to container', () => {
    render(<DateRangePicker onChange={mockOnChange} className="custom-class" />);
    
    expect(screen.getByTestId('date-range-picker')).toHaveClass('custom-class');
  });

  it('handles days from previous and next months correctly', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // The calendar should show days from previous and next months
    // These days should have the 'other-month' class
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day'));
    
    // Check that we have 42 days (6 weeks × 7 days)
    expect(calendarDays.length).toBe(42);
    
    // Some days should have the 'other-month' class
    const otherMonthDays = calendarDays.filter(day => day.classList.contains('other-month'));
    expect(otherMonthDays.length).toBeGreaterThan(0);
  });

  it('completes selection with same date when clicking outside with only start date selected', async () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    // Open calendar
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Select only start date
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    fireEvent.click(calendarDays[10]);
    
    // Click outside (simulate by firing mousedown on document)
    fireEvent.mouseDown(document);
    
    // Wait for the effect to run
    await waitFor(() => {
      // Check that onChange was called with both start and end dates equal
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall.startDate).toBeInstanceOf(Date);
      expect(lastCall.endDate).toBeInstanceOf(Date);
      
      // Start and end dates should be the same
      const startDate = new Date(lastCall.startDate);
      const endDate = new Date(lastCall.endDate);
      expect(startDate.getDate()).toBe(endDate.getDate());
      expect(startDate.getMonth()).toBe(endDate.getMonth());
      expect(startDate.getFullYear()).toBe(endDate.getFullYear());
    });
  });

  it('handles keyboard navigation for all interactive elements', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    // Open calendar with Space key
    const dateRangeDisplay = screen.getByTestId('date-range-display');
    fireEvent.keyDown(dateRangeDisplay, { key: ' ' });
    
    // Test all navigation buttons with keyboard
    const navButtons = [
      { element: 'calendar-prev-year', key: ' ' },
      { element: 'calendar-prev-month', key: ' ' },
      { element: 'calendar-next-month', key: ' ' },
      { element: 'calendar-next-year', key: ' ' },
    ];
    
    navButtons.forEach(({ element, key }) => {
      const button = screen.getByTestId(element);
      fireEvent.keyDown(button, { key });
    });
    
    // Test close button with keyboard
    const closeButton = screen.getByTestId('date-range-close-btn');
    fireEvent.keyDown(closeButton, { key: ' ' });
    
    // Calendar should be closed and dates reset
    expect(screen.queryByTestId('calendar-container')).not.toBeInTheDocument();
    expect(mockOnChange).toHaveBeenLastCalledWith({
      startDate: null,
      endDate: null
    });
  });

  it('renders weekday headers correctly', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    const weekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const weekdayElements = screen.getByTestId('calendar-days-header').querySelectorAll('.calendar-weekday');
    
    expect(weekdayElements.length).toBe(7);
    
    weekdayElements.forEach((element, index) => {
      expect(element).toHaveTextContent(weekdays[index]);
    });
  });

  it('handles date selection with keyboard Space key', () => {
    render(<DateRangePicker onChange={mockOnChange} />);
    
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Select a date with Space key
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    fireEvent.keyDown(calendarDays[10], { key: ' ' });
    
    // Verify onChange was called
    expect(mockOnChange).toHaveBeenCalled();
    
    // First call should be with just the start date
    const firstCall = mockOnChange.mock.calls[0][0];
    expect(firstCall.startDate).toBeInstanceOf(Date);
    expect(firstCall.endDate).toBeNull();
  });

  it('applies correct CSS classes to selected date range', () => {
    // Initialize with a date range
    const initialDateRange = {
      startDate: new Date(2023, 5, 10), // June 10, 2023
      endDate: new Date(2023, 5, 15)    // June 15, 2023
    };
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialDateRange}
      />
    );
    
    // Open the calendar to check the styling
    fireEvent.click(screen.getByTestId('date-range-display'));
    
    // Find all days in the current month
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    
    // Find days that have the 'selected' class
    const selectedDays = calendarDays.filter(day => day.classList.contains('selected'));
    expect(selectedDays.length).toBeGreaterThan(0);
    
    // Find days that have the 'start-date' and 'end-date' classes
    const startDateDay = calendarDays.find(day => day.classList.contains('start-date'));
    const endDateDay = calendarDays.find(day => day.classList.contains('end-date'));
    
    expect(startDateDay).toBeDefined();
    expect(endDateDay).toBeDefined();
  });

  it('handles null values in date range correctly', () => {
    const initialDateRange = {
      startDate: null,
      endDate: null
    };
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialDateRange}
      />
    );
    
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('Select date range');
    
    // Open calendar and select a date
    fireEvent.click(screen.getByTestId('date-range-display'));
    const calendarDays = screen.getAllByRole('button')
      .filter(el => el.classList.contains('calendar-day') && el.classList.contains('current-month'));
    fireEvent.click(calendarDays[10]);
    
    // Check that onChange was called with the correct date range
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      startDate: expect.any(Date),
      endDate: null
    }));
  });

  it('handles partial date range with only startDate', () => {
    const initialDateRange = {
      startDate: new Date(2023, 5, 10),
      endDate: null
    };
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialDateRange}
        dateFormat="MM/DD/YYYY"
      />
    );
    
    // Should show the start date and placeholder for end date
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('06/10/2023 - MM/DD/YYYY');
  });

  it('handles partial date range with only endDate', () => {
    const initialDateRange = {
      startDate: null,
      endDate: new Date(2023, 5, 15)
    };
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialDateRange}
        dateFormat="MM/DD/YYYY"
      />
    );
    
    // Should show placeholder for start date and the end date
    expect(screen.getByTestId('date-range-text')).toHaveTextContent('MM/DD/YYYY - 06/15/2023');
  });
});
