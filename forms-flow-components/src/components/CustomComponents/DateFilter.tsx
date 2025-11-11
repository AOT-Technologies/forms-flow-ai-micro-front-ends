import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, memo } from "react";
import { useTranslation } from "react-i18next";
import {
  DownArrowIcon,
  UpArrowIcon,
  CalenderLeftIcon,
  CalenderRightIcon,
  CloseIcon,
} from "../SvgIcons";
import { V8CustomButton } from "./CustomButton";

/**
 * Date value type - can be Date object, ISO string, or null
 */
type DateValue = Date | string | null;

/**
 * Date range interface for start and end dates
 */
export interface DateRange {
  /** Start date of the range */
  startDate: DateValue;
  /** End date of the range */
  endDate: DateValue;
}

/**
 * Calendar day interface for rendering calendar grid
 */
interface CalendarDay {
  /** The actual date object */
  date: Date;
  /** Whether this day belongs to the current month */
  isCurrentMonth: boolean;
}

/**
 * Props for `DateRangePicker` component.
 * Optimized, accessible date range picker with calendar interface.
 */
export interface DateRangePickerProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Callback function triggered when date range changes */
  onChange: (dateRange: DateRange) => void;
  /** Initial date range to display */
  value?: DateRange;
  /** Format for displaying dates (default: MM/DD/YYYY) */
  dateFormat?: string;
  /** Placeholder text when no dates are selected */
  placeholder?: string;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (
  ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

/**
 * DateRangePicker: Accessible, memoized date range picker with calendar interface.
 *
 * Usage:
 * <DateRangePicker
 *   onChange={(range) => console.log(range)}
 *   value={{ startDate: new Date(), endDate: new Date() }}
 *   placeholder="Select date range"
 *   dateFormat="MM/DD/YYYY"
 * />
 */
const DateRangePickerComponent = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      onChange,
      value,
      dateFormat = "MM/DD/YYYY",
      className = "",
      placeholder = "Select date range",
      ...restProps
    },
    ref
  ) => {
    const { t } = useTranslation();
    const calendarRef = useRef<HTMLDivElement>(null);

    // Memoized date parsing utility
    const parseDate = useCallback((dateInput: DateValue): Date => {
      if (!dateInput) return new Date();

      if (dateInput instanceof Date) return dateInput;

      try {
        const parsedDate = new Date(dateInput);
        // Handle ISO strings by converting to local date
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
    }, []);

    // Memoized default date range
    const defaultDateRange = useMemo((): DateRange => ({
      startDate: null,
      endDate: null,
    }), []);

    // Memoized parsed initial range
    const parsedInitialRange = useMemo((): DateRange => ({
      startDate: value?.startDate ? parseDate(value.startDate) : null,
      endDate: value?.endDate ? parseDate(value.endDate) : null,
    }), [value, parseDate]);

    // State management
    const [dateRange, setDateRange] = useState<DateRange>(parsedInitialRange);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
      if (parsedInitialRange.startDate) {
        return parsedInitialRange.startDate instanceof Date
          ? parsedInitialRange.startDate
          : parseDate(parsedInitialRange.startDate);
      }
      return new Date();
    });

    // Update state when value prop changes
    useEffect(() => {
      if (value) {
        const newDateRange = {
          startDate: value?.startDate ? parseDate(value.startDate) : null,
          endDate: value?.endDate ? parseDate(value.endDate) : null,
        };

        setDateRange(newDateRange);

        if (newDateRange.startDate) {
          setCurrentMonth(
            newDateRange.startDate instanceof Date
              ? new Date(newDateRange.startDate)
              : parseDate(newDateRange.startDate)
          );
        }
      } else {
        setDateRange(defaultDateRange);
      }
    }, [value, parseDate, defaultDateRange]);

    // Memoized date formatting utility
    const formatDateValue = useCallback((
      date: Date | string | null,
      format: string = dateFormat
    ): string => {
      if (!date) return "";

      const dateObj = date instanceof Date ? date : parseDate(date);
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const year = dateObj.getFullYear();

      let formattedDate = format;
      formattedDate = formattedDate.replace(/M+/g, month);
      formattedDate = formattedDate.replace(/D+/g, day);
      formattedDate = formattedDate.replace(/Y+/g, year.toString());

      return formattedDate;
    }, [dateFormat, parseDate]);

    // Memoized date range formatting
    const formatDateRange = useMemo((): string => {
      if (!dateRange.startDate && !dateRange.endDate) {
        return isOpen ? t("Select Date") : t(placeholder);
      }

      const start = formatDateValue(dateRange.startDate);
      const end = formatDateValue(dateRange.endDate);

      return `${start} - ${end}`;
    }, [dateRange, isOpen, t, placeholder, formatDateValue]);

    // Memoized calendar days generation
    const generateDays = useMemo((): CalendarDay[] => {
      if (!currentMonth) return [];

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

      // Adjust for Monday as first day of week
      const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

      // Previous month days
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

      // Next month days to fill calendar
      const nextMonthDays: CalendarDay[] = [];
      const totalDaysSoFar = daysFromPrevMonth.length + currentMonthDays.length;
      const daysNeeded = 42 - totalDaysSoFar;

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
    }, [currentMonth]);

    // Memoized date normalization utility
    const normalizeDate = useCallback((date: Date | string | null): Date | null => {
      if (!date) return null;

      if (date instanceof Date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      const parsedDate = parseDate(date);
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate()
      );
    }, [parseDate]);

    // Memoized date range checking utilities
    const isInRange = useCallback((date: Date): boolean => {
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
    }, [dateRange, normalizeDate]);

    const isStartDate = useCallback((date: Date): boolean => {
      const startDate = normalizeDate(dateRange?.startDate);
      const targetDate = normalizeDate(date);

      return !!(
        targetDate &&
        startDate &&
        targetDate.getTime() === startDate.getTime()
      );
    }, [dateRange, normalizeDate]);

    const isEndDate = useCallback((date: Date): boolean => {
      const endDate = normalizeDate(dateRange?.endDate);
      const targetDate = normalizeDate(date);

      return !!(
        targetDate &&
        endDate &&
        targetDate.getTime() === endDate.getTime()
      );
    }, [dateRange, normalizeDate]);

    // Memoized filter date range creation
    const createFilterDateRange = useCallback((startDate: Date, endDate: Date): DateRange => {
      const filterStartDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        0, 0, 0, 0
      );
      const filterEndDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        23, 59, 59, 999
      );

      return {
        startDate: filterStartDate,
        endDate: filterEndDate,
      };
    }, []);

    // Memoized date selection handler
    const handleDateSelect = useCallback((date: Date): void => {
      if (!date) return;

      const selectedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
        const newRange = {
          startDate: selectedDate,
          endDate: null,
        };
        setDateRange(newRange);
        onChange(newRange);
      } else {
        const currentStartDate = dateRange.startDate instanceof Date
          ? new Date(
              dateRange.startDate.getFullYear(),
              dateRange.startDate.getMonth(),
              dateRange.startDate.getDate()
            )
          : parseDate(dateRange.startDate);

        const newStartDate = selectedDate < currentStartDate ? selectedDate : currentStartDate;
        const newEndDate = selectedDate < currentStartDate ? currentStartDate : selectedDate;

        const filterRange = createFilterDateRange(newStartDate, newEndDate);
        const newRange = {
          startDate: filterRange.startDate,
          endDate: filterRange.endDate,
        };

        setDateRange(newRange);
        onChange(newRange);
      }
    }, [dateRange, parseDate, createFilterDateRange, onChange]);

    // Memoized keyboard event handler for date selection
    const handleDateKeyDown = useCallback((
      event: React.KeyboardEvent<HTMLButtonElement>,
      date: Date
    ): void => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleDateSelect(date);
      }
    }, [handleDateSelect]);

    // Memoized navigation methods
    const goToPrevMonth = useCallback((): void => {
      if (!currentMonth) return;
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    }, [currentMonth]);

    const goToNextMonth = useCallback((): void => {
      if (!currentMonth) return;
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    }, [currentMonth]);

    const goToPrevYear = useCallback((): void => {
      if (!currentMonth) return;
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1)
      );
    }, [currentMonth]);

    const goToNextYear = useCallback((): void => {
      if (!currentMonth) return;
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1)
      );
    }, [currentMonth]);

    // Memoized today button handler
    const handleTodayClick = useCallback((): void => {
      const today = new Date();
      const normalizedToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const filterRange = createFilterDateRange(normalizedToday, normalizedToday);
      setDateRange({
        startDate: filterRange.startDate,
        endDate: filterRange.endDate,
      });
      setCurrentMonth(normalizedToday);
      onChange({
        startDate: filterRange.startDate,
        endDate: filterRange.endDate,
      });
    }, [createFilterDateRange, onChange]);

    // Memoized reset button handler
    const handleResetClick = useCallback((): void => {
      const emptyDateRange = {
        startDate: null,
        endDate: null,
      };
      setDateRange(emptyDateRange);
      onChange(emptyDateRange);
    }, [onChange]);

    // Memoized keyboard navigation handler
    const handleNavKeyDown = useCallback((
      event: React.KeyboardEvent<HTMLButtonElement>,
      action: () => void
    ): void => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    }, []);

    // Memoized calendar toggle handler
    const toggleCalendar = useCallback((): void => {
      setIsOpen(!isOpen);
    }, [isOpen]);

    // Memoized container className
    const containerClassName = useMemo(
      () => buildClassNames("date-range-picker-container", className),
      [className]
    );

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

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen, dateRange, parseDate, createFilterDateRange, onChange]);

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
        ref={ref}
        className={containerClassName}
        data-testid="date-range-picker"
      >
      <div className="drp-input-container">
        <input
          onClick={toggleCalendar}
          type="text"
          className="drp-date-input"
          value={formatDateValue(dateRange.startDate)}
          readOnly
          aria-label="Start date"
          placeholder="Start date"
        />
        <span className="drp-separator">to</span>
        <input
        onClick={toggleCalendar}
          type="text"
          className="drp-date-input"
          value={formatDateValue(dateRange.endDate)}
          readOnly
          aria-label="End date"
          placeholder="End date"
        />

        <span
          className={`date-range-toggle-icon cursor-pointer ${isOpen ? "open" : ""}`}
          data-testid="date-range-toggle-icon"
          aria-hidden="true"
          onClick={toggleCalendar}
        >
          {isOpen ? (
            <UpArrowIcon color="#4A4A4A" />
          ) : (
            <DownArrowIcon color="#4A4A4A" />
          )}
        </span>
        {(dateRange.startDate || dateRange.endDate) && (
          <span
            className="date-range-close-icon cursor-pointer"
            data-testid="date-range-close-icon"
            aria-label="Clear date range"
            onClick={handleCloseCalendar}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCloseCalendar();
              }
            }}
          >
            <CloseIcon color="#4A4A4A" />
          </span>
        )}
      </div>

      {isOpen && (
        <div
          ref={calendarRef}
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
                <CalenderLeftIcon color="#212529" />
                <CalenderLeftIcon color="#212529" />
              </button>
              <button
                className="calendar-prev-month-btn button-as-div"
                onKeyDown={(e) => handleNavKeyDown(e, goToPrevMonth)}
                data-testid="calendar-prev-month"
                aria-label={t("Previous month")}
                type="button"
                onClick={goToPrevMonth}
              >
                <CalenderLeftIcon color="#212529" />
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
                <CalenderRightIcon color="#212529" />
              </button>
              <button
                className="calendar-next-year-btn button-as-div"
                onClick={goToNextYear}
                onKeyDown={(e) => handleNavKeyDown(e, goToNextYear)}
                data-testid="calendar-next-year"
                aria-label={t("Next year")}
                type="button"
              >
                <CalenderRightIcon color="#212529" />
                <CalenderRightIcon color="#212529" />


              </button>
            </div>
          </div>

          <div className="calender-week-days-container">
          <div
            className="calendar-days-header"
            data-testid="calendar-days-header"
          >
            {[
              t("Mon"),
              t("Tue"),
              t("Wed"),
              t("Thu"),
              t("Fri"),
              t("Sat"),
              t("Sun"),
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
            {generateDays.map((dayObj) => {
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
          <div className="calendar-today-container">
            <V8CustomButton 
            label="Today"
            onClick={handleTodayClick}
            ariaLabel="Today"
            dataTestId="calendar-today-btn"
            variant="secondary"
            />
            <V8CustomButton 
            label="Reset"
            onClick={handleResetClick}
            ariaLabel="Reset"
            dataTestId="calendar-reset-btn"
            variant="secondary"
            />
          </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Set display name for better debugging
DateRangePickerComponent.displayName = "DateRangePicker";

// Export memoized component for performance optimization
export const DateRangePicker = memo(DateRangePickerComponent);

// Export types for consumers
export type { DateRangePickerProps as DateRangePickerPropsType };
