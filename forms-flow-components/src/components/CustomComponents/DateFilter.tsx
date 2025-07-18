import React, { useState, useRef, useEffect, FC, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  AngleLeftIcon,
  AngleRightIcon,
  CloseIcon,
  RightFarIcon,
  LeftFarIcon,
  DownArrowIcon,
  UpArrowIcon,
} from "../SvgIcons";

type DateValue = Date | string | null;
interface DateRange {
  startDate: DateValue;
  endDate: DateValue;
}

interface DateRangePickerProps {
  /**
   * Callback function triggered when date range changes
   * @param dateRange Object containing startDate and endDate
   */
  onChange: (dateRange: DateRange) => void;

  /**
   * Initial date range to display
   */
  value?: DateRange;

  /**
   * Format for displaying dates (default: MM/DD/YYYY)
   */
  dateFormat?: string;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Placeholder text when no dates are selected
   */
  placeholder?: string;
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  onChange,
  value,
  dateFormat = "MM/DD/YYYY",
  className = "",
  placeholder = "Select date range",
}) => {
  const { t } = useTranslation();
  const calendarRef = useRef<HTMLDivElement>(null);

  // Parse date strings if provided in any format (including ISO format)
  // Handles both Date objects and string representations of dates currently supports the ISO 8601 format
  const parseDate = (dateInput: DateValue): Date => {
    if (!dateInput) return new Date();

    // If it's already a Date object
    if (dateInput instanceof Date) return dateInput;

    // Parse string date (handles ISO format like "2025-03-12T11:49:57+00:00")
    try {
      const parsedDate = new Date(dateInput);
      // If the input is an ISO string, convert to local date to avoid timezone issues
      if (typeof dateInput === "string" && dateInput.includes("T")) {
        return new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate()
        );
      }
      return parsedDate;
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date();
    }
  };

  // Set default initial date range
  const getDefaultDateRange = (): DateRange => {
    return {
      startDate: null,
      endDate: null,
    };
  };

  // Parse initial date range with fallbacks for null values
  const parsedInitialRange = (): DateRange => {
    return {
      startDate: value?.startDate ? parseDate(value.startDate) : null,
      endDate: value?.endDate ? parseDate(value.endDate) : null,
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(parsedInitialRange());
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Safely get start date for current month
    const range = parsedInitialRange();
    if (range.startDate) {
      return range.startDate instanceof Date
        ? range.startDate
        : parseDate(range.startDate);
    }
    return new Date(); // Default to current month if no range provided
  });

  // Update state when value prop changes
  useEffect(() => {
    if (value) {
      const newDateRange = {
        startDate: value?.startDate ? parseDate(value.startDate) : null,
        endDate: value?.endDate ? parseDate(value.endDate) : null,
      };

      setDateRange(newDateRange);

      // Safely update current month if startDate exists
      if (newDateRange.startDate) {
        setCurrentMonth(
          newDateRange.startDate instanceof Date
            ? new Date(newDateRange.startDate)
            : parseDate(newDateRange.startDate)
        );
      }
    } else {
      // Reset to empty range if value is undefined/null
      setDateRange(getDefaultDateRange());
    }
  }, [value]);

  // Format date according to specified format (default: MM/DD/YYYY)
  const formatDateValue = (
    date: Date | string | null,
    format: string = dateFormat
  ): string => {
    // If no date, return empty
    if (!date) {
      return "";
    }

    // Convert to Date object if string
    const dateObj = date instanceof Date ? date : parseDate(date);

    // Format according to specified pattern
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();

    let formattedDate = format;
    formattedDate = formattedDate.replace(/M+/g, month);
    formattedDate = formattedDate.replace(/D+/g, day);
    formattedDate = formattedDate.replace(/Y+/g, year.toString());

    return formattedDate;
  };

  const formatDateRange = (): string => {
    // If no dates selected
    if (!dateRange.startDate && !dateRange.endDate) {
      return isOpen ? t("Select Date") : t(placeholder);
    }

    const start = formatDateValue(dateRange.startDate);
    const end = formatDateValue(dateRange.endDate);

    return `${start} - ${end}`;
  };

  interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
  }

  // Generate days for the calendar
  const generateDays = (): CalendarDay[] => {
    if (!currentMonth) {
      setCurrentMonth(new Date());
      return [];
    }

    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    // Adjust for Monday as first day of week (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Get days from previous month
    const daysFromPrevMonth: CalendarDay[] = [];
    if (adjustedFirstDay > 0) {
      const prevMonthDays = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        0
      ).getDate();

      for (let i = adjustedFirstDay - 1; i >= 0; i--) {
        const prevDate = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          prevMonthDays - i
        );
        daysFromPrevMonth.push({
          date: prevDate,
          isCurrentMonth: false,
        });
      }
    }

    // Current month days
    const currentMonthDays: CalendarDay[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i
      );
      currentMonthDays.push({
        date,
        isCurrentMonth: true,
      });
    }

    // Next month days to fill the calendar
    const nextMonthDays: CalendarDay[] = [];
    const totalDaysSoFar = daysFromPrevMonth.length + currentMonthDays.length;
    const daysNeeded = 42 - totalDaysSoFar; // 6 rows of 7 days

    for (let i = 1; i <= daysNeeded; i++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        i
      );
      nextMonthDays.push({
        date,
        isCurrentMonth: false,
      });
    }

    return [...daysFromPrevMonth, ...currentMonthDays, ...nextMonthDays];
  };

  const normalizeDate = (date: Date | string | null): Date | null => {
    if (!date) return null;

    if (date instanceof Date) {
      // Create a new date with local timezone to avoid UTC issues
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const parsedDate = parseDate(date);
    return new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    );
  };

  // Check if date is in selected range
  const isInRange = (date: Date): boolean => {
    const startDate = normalizeDate(dateRange?.startDate);
    const endDate = normalizeDate(dateRange?.endDate);
    const targetDate = normalizeDate(date);

    return !!(
      targetDate &&
      startDate &&
      endDate &&
      targetDate >= startDate &&
      targetDate <= endDate
    );
  };

  // Check if date is start date
  const isStartDate = (date: Date): boolean => {
    const startDate = normalizeDate(dateRange?.startDate);
    const targetDate = normalizeDate(date);

    return !!(
      targetDate &&
      startDate &&
      targetDate.getTime() === startDate.getTime()
    );
  };

  // Check if date is end date
  const isEndDate = (date: Date): boolean => {
    const endDate = normalizeDate(dateRange?.endDate);
    const targetDate = normalizeDate(date);

    return !!(
      targetDate &&
      endDate &&
      targetDate.getTime() === endDate.getTime()
    );
  };

  // Helper function to create proper date range for filtering
  const createFilterDateRange = (startDate: Date, endDate: Date): DateRange => {
    // Create new date objects to avoid mutating the originals and handle timezone properly
    const filterStartDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0,
      0,
      0,
      0
    );
    const filterEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
      999
    );

    return {
      startDate: filterStartDate,
      endDate: filterEndDate,
    };
  };

  // Handle date selection
  const handleDateSelect = (date: Date): void => {
    if (!date) return;

    // Create a new date object with local timezone (avoid UTC conversion issues)
    const selectedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      const newRange = {
        startDate: selectedDate,
        endDate: null,
      };

      setDateRange(newRange);
      // Always notify parent of changes, even for partial selections
      onChange(newRange);
    } else {
      // Complete the selection
      let newStartDate: Date;
      let newEndDate: Date;

      const currentStartDate =
        dateRange.startDate instanceof Date
          ? new Date(
              dateRange.startDate.getFullYear(),
              dateRange.startDate.getMonth(),
              dateRange.startDate.getDate()
            )
          : parseDate(dateRange.startDate);

      if (selectedDate < currentStartDate) {
        newStartDate = selectedDate;
        newEndDate = currentStartDate;
      } else {
        newStartDate = currentStartDate;
        newEndDate = selectedDate;
      }

      // Create proper filter range with start of day and end of day
      const filterRange = createFilterDateRange(newStartDate, newEndDate);

      const newRange = {
        startDate: filterRange.startDate,
        endDate: filterRange.endDate,
      };

      setDateRange(newRange);
      // Notify parent component of the complete selection
      onChange(newRange);
    }
  };

  // Handle keyboard event for date selection
  const handleDateKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    date: Date
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleDateSelect(date);
    }
  };

  // Navigation methods
  const goToPrevMonth = (): void => {
    if (!currentMonth) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = (): void => {
    if (!currentMonth) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToPrevYear = (): void => {
    if (!currentMonth) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1)
    );
  };

  const goToNextYear = (): void => {
    if (!currentMonth) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1)
    );
  };

  // Handle keyboard navigation
  const handleNavKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      action();
    }
  };

  // Handle calendar toggle
  const toggleCalendar = (): void => {
    setIsOpen(!isOpen);
  };

  // Handle close calendar (X button)
  const handleCloseCalendar = (event?: React.MouseEvent): void => {
    if (event) {
      event.stopPropagation();
    }
    setIsOpen(false);

    // Reset both dates to null when closing with the X button
    const emptyDateRange = {
      startDate: null,
      endDate: null,
    };

    setDateRange(emptyDateRange);

    // Notify parent component of the reset
    onChange(emptyDateRange);
  };

  // Format month and year for display
  const formatMonthYear = (): string => {
    if (!currentMonth) return "";

    const months = [
      t("January"),
      t("February"),
      t("March"),
      t("April"),
      t("May"),
      t("June"),
      t("July"),
      t("August"),
      t("September"),
      t("October"),
      t("November"),
      t("December"),
    ];
    return `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);

        // If selection is incomplete, complete it with current dates
        if (dateRange.startDate && !dateRange.endDate) {
          // Create proper filter range for single date selection
          const startDateObj =
            dateRange.startDate instanceof Date
              ? dateRange.startDate
              : parseDate(dateRange.startDate);

          const singleDateRange = createFilterDateRange(
            startDateObj,
            startDateObj
          );

          setDateRange(singleDateRange);

          // Notify parent component of the completed selection
          onChange(singleDateRange);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateRange, onChange]);

  // Reset current month when opening calendar
  useEffect(() => {
    if (isOpen && dateRange?.startDate) {
      setCurrentMonth(
        dateRange.startDate instanceof Date
          ? new Date(dateRange.startDate)
          : parseDate(dateRange.startDate)
      );
    }
  }, [isOpen, dateRange?.startDate]);

  return (
    <div
      className={`date-range-picker-container ${className}`}
      ref={calendarRef}
      data-testid="date-range-picker"
    >
      <button
        className={`date-range-display ${isOpen ? "open" : ""} button-as-div`}
        onClick={toggleCalendar}
        onKeyDown={(e) => handleNavKeyDown(e, toggleCalendar)}
        data-testid="date-range-display"
        aria-label={t("Date range selector")}
        aria-expanded={isOpen}
        type="button"
      >
        <span
          className={`date-range-text ${isOpen ? "open" : ""}`}
          data-testid="date-range-text"
        >
          {formatDateRange()}
        </span>
        <div className="date-range-controls">
          {isOpen && (
            <button
              className="date-range-close button-as-div"
              data-testid="date-range-close-btn"
              aria-label={t("Close calendar")}
              type="button"
              onClick={(e) => handleCloseCalendar(e)}
              onKeyDown={(e) =>
                handleNavKeyDown(e, () => handleCloseCalendar())
              }
            >
              <CloseIcon />
            </button>
          )}
          <span
            className={`date-range-toggle-icon ${isOpen ? "open" : ""}`}
            data-testid="date-range-toggle-icon"
            aria-hidden="true"
          >
            {isOpen ? (
              <UpArrowIcon color="white" />
            ) : (
              <DownArrowIcon color="white" />
            )}
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          className="calendar-container"
          data-testid="calendar-container"
          aria-label={t("Date picker")}
        >
          <div className="calendar-header" data-testid="calendar-header">
            <div className="calendar-nav-buttons">
              <button
                className="calendar-prev-year-btn button-as-div"
                onClick={goToPrevYear}
                onKeyDown={(e) => handleNavKeyDown(e, goToPrevYear)}
                data-testid="calendar-prev-year"
                aria-label={t("Previous year")}
                type="button"
              >
                <LeftFarIcon />
              </button>
              <button
                className="calendar-prev-month-btn button-as-div"
                onKeyDown={(e) => handleNavKeyDown(e, goToPrevMonth)}
                data-testid="calendar-prev-month"
                aria-label={t("Previous month")}
                type="button"
                onClick={goToPrevMonth}
              >
                <AngleLeftIcon />
              </button>
            </div>
            <span
              className="calendar-month-year"
              data-testid="calendar-month-year"
            >
              {formatMonthYear()}
            </span>
            <div className="calendar-nav-buttons">
              <button
                className="calendar-next-month-btn button-as-div"
                onKeyDown={(e) => handleNavKeyDown(e, goToNextMonth)}
                data-testid="calendar-next-month"
                aria-label={t("Next month")}
                type="button"
                onClick={goToNextMonth}
              >
                <AngleRightIcon />
              </button>
              <button
                className="calendar-next-year-btn button-as-div"
                onClick={goToNextYear}
                onKeyDown={(e) => handleNavKeyDown(e, goToNextYear)}
                data-testid="calendar-next-year"
                aria-label={t("Next year")}
                type="button"
              >
                <RightFarIcon />
              </button>
            </div>
          </div>

          <div
            className="calendar-days-header"
            data-testid="calendar-days-header"
          >
            {[
              t("MO"),
              t("TU"),
              t("WE"),
              t("TH"),
              t("FR"),
              t("SA"),
              t("SU"),
            ].map((day) => (
              <div
                key={day}
                className="calendar-weekday"
                aria-label={`${t("Day of week")}: ${day}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days" data-testid="calendar-days">
            {generateDays().map((dayObj) => {
              const date = dayObj?.date;
              if (!date) return null;

              const selected = isInRange(date);
              const isStart = isStartDate(date);
              const isEnd = isEndDate(date);
              const dayNumber = date.getDate();

              const dayClasses = [
                "calendar-day",
                "button-as-div",
                dayObj?.isCurrentMonth ? "current-month" : "other-month",
                selected ? "selected" : "",
                isStart ? "start-date" : "",
                isEnd ? "end-date" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={date.toISOString()} // Unique key using ISO string
                  onClick={() => handleDateSelect(date)}
                  onKeyDown={(e) => handleDateKeyDown(e, date)}
                  className={dayClasses}
                  data-testid={`calendar-day-${dayNumber}`}
                  aria-label={`${date.toLocaleDateString()}, ${
                    selected ? t("selected") : t("not selected")
                  }`}
                  type="button"
                >
                  {dayNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
