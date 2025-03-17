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

interface DateRange {
  startDate: Date | string | null;
  endDate: Date | string | null;
}

interface DateRangePickerProps {
  onChange?: (dateRange: DateRange) => void;
  initialDateRange?: DateRange;
  dateFormat?: string;
  className?: string;
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  onChange,
  initialDateRange,
  dateFormat = "MM/DD/YYYY",
  className = "",
}) => {
  const { t } = useTranslation();
  const calendarRef = useRef<HTMLDivElement>(null);

  // Parse date strings if provided in any format (including ISO format)
  const parseDate = (dateInput: Date | string | null): Date => {
    if (!dateInput) return new Date();

    // If it's already a Date object
    if (dateInput instanceof Date) return dateInput;

    // Parse string date (handles ISO format like "2025-03-12T11:49:57+00:00")
    try {
      return new Date(dateInput);
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date();
    }
  };

  // Set default initial date range
  const getDefaultDateRange = (): DateRange => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    return {
      startDate: today,
      endDate: thirtyDaysLater,
    };
  };

  // Parse initial date range with fallbacks for null values
  const parsedInitialRange = (): DateRange => {
    if (!initialDateRange) return getDefaultDateRange();

    return {
      startDate: initialDateRange.startDate
        ? parseDate(initialDateRange.startDate)
        : new Date(),
      endDate: initialDateRange.endDate
        ? parseDate(initialDateRange.endDate)
        : new Date(new Date().setDate(new Date().getDate() + 30)),
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(parsedInitialRange());
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Safely get start date for current month
    const range = parsedInitialRange();
    return range.startDate instanceof Date
      ? range.startDate
      : parseDate(range.startDate);
  });

  // Update state when initialDateRange prop changes
  useEffect(() => {
    if (initialDateRange) {
      const newDateRange = {
        startDate: initialDateRange.startDate
          ? parseDate(initialDateRange.startDate)
          : new Date(),
        endDate: initialDateRange.endDate
          ? parseDate(initialDateRange.endDate)
          : new Date(new Date().setDate(new Date().getDate() + 30)),
      };
      setDateRange(newDateRange);

      // Safely update current month
      if (newDateRange.startDate) {
        setCurrentMonth(
          newDateRange.startDate instanceof Date
            ? newDateRange.startDate
            : parseDate(newDateRange.startDate)
        );
      }
    }
  }, [initialDateRange]);

  // Format date according to specified format (default: MM/DD/YYYY)
  const formatDate = (date: Date | null): string => {
    if (!date) return "MM/DD/YYYY";

    // Default format (MM/DD/YYYY)
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format date range for display
  const formatDateRange = (): string => {
    const start = dateRange?.startDate
      ? formatDate(
          dateRange.startDate instanceof Date
            ? dateRange.startDate
            : parseDate(dateRange.startDate)
        )
      : "MM/DD/YYYY";
    const end = dateRange?.endDate
      ? formatDate(
          dateRange.endDate instanceof Date
            ? dateRange.endDate
            : parseDate(dateRange.endDate)
        )
      : "MM/DD/YYYY";
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

  // Check if date is in selected range
  const isInRange = (date: Date): boolean => {
    if (!date || !dateRange || !dateRange.startDate || !dateRange.endDate)
      return false;

    // Reset hours, minutes, seconds and milliseconds for proper comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const normalizedStartDate = new Date(
      dateRange.startDate instanceof Date
        ? dateRange.startDate
        : parseDate(dateRange.startDate)
    );
    normalizedStartDate.setHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(
      dateRange.endDate instanceof Date
        ? dateRange.endDate
        : parseDate(dateRange.endDate)
    );
    normalizedEndDate.setHours(0, 0, 0, 0);

    return (
      normalizedDate >= normalizedStartDate &&
      normalizedDate <= normalizedEndDate
    );
  };

  // Check if date is start date
  const isStartDate = (date: Date): boolean => {
    if (!date || !dateRange || !dateRange.startDate) return false;

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const normalizedStartDate = new Date(
      dateRange.startDate instanceof Date
        ? dateRange.startDate
        : parseDate(dateRange.startDate)
    );
    normalizedStartDate.setHours(0, 0, 0, 0);

    return normalizedDate.getTime() === normalizedStartDate.getTime();
  };

  // Check if date is end date
  const isEndDate = (date: Date): boolean => {
    if (!date || !dateRange || !dateRange.endDate) return false;

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(
      dateRange.endDate instanceof Date
        ? dateRange.endDate
        : parseDate(dateRange.endDate)
    );
    normalizedEndDate.setHours(0, 0, 0, 0);

    return normalizedDate.getTime() === normalizedEndDate.getTime();
  };

  // Handle date selection
  const handleDateSelect = (date: Date): void => {
    if (!date) return;

    // Clone the date to avoid reference issues
    const selectedDate = new Date(date);

    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      setDateRange({
        startDate: selectedDate,
        endDate: null,
      });
    } else {
      // Complete the selection
      let newStartDate: Date;
      let newEndDate: Date;

      const currentStartDate =
        dateRange.startDate instanceof Date
          ? dateRange.startDate
          : parseDate(dateRange.startDate);

      if (selectedDate < currentStartDate) {
        newStartDate = selectedDate;
        newEndDate = currentStartDate;
      } else {
        newStartDate = currentStartDate;
        newEndDate = selectedDate;
      }

      setDateRange({
        startDate: newStartDate,
        endDate: newEndDate,
      });

      // Trigger onChange after completing selection
      if (onChange) {
        onChange({
          startDate: newStartDate,
          endDate: newEndDate,
        });
      }
    }
  };

  // Handle keyboard event for date selection
  const handleDateKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
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
  const handlePrevMonthKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToPrevMonth();
    }
  };

  const handleNextMonthKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToNextMonth();
    }
  };

  const handlePrevYearKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToPrevYear();
    }
  };

  const handleNextYearKeyDown = (
    event: KeyboardEvent<HTMLSpanElement>
  ): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToNextYear();
    }
  };

  // Handle keyboard toggle for calendar
  const handleToggleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCalendar();
    }
  };

  // Handle keyboard close for calendar
  const handleCloseKeyDown = (event: KeyboardEvent<HTMLSpanElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
    }
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

  // Toggle calendar open/close
  const toggleCalendar = (): void => {
    setIsOpen(!isOpen);
    if (isOpen) {
      // Reset to initial date range if calendar is closing without selection
      if (!dateRange?.endDate) {
        setDateRange(parsedInitialRange());
      }
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset if selection is incomplete
        if (!dateRange?.endDate) {
          setDateRange(parsedInitialRange());
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dateRange]);

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
      <div
        className={`date-range-display ${isOpen ? "open" : ""}`}
        onClick={toggleCalendar}
        onKeyDown={handleToggleKeyDown}
        data-testid="date-range-display"
        aria-label={t("Date range selector")}
        aria-expanded={isOpen}
        role="button"
        tabIndex={0}
      >
        <span data-testid="date-range-text">{formatDateRange()}</span>
        <div className="date-range-controls">
          <span
            className="date-range-close"
            data-testid="date-range-close-btn"
            aria-label={t("Close calendar")}
            role="button"
            tabIndex={0}
            onKeyDown={handleCloseKeyDown}
          >
            <CloseIcon
              color="white"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />
          </span>
          <span
            className="date-range-toggle-icon"
            data-testid="date-range-toggle-icon"
            aria-hidden="true"
          >
            {isOpen ? (
              <DownArrowIcon color="white" />
            ) : (
              <UpArrowIcon color="white" />
            )}
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          className="calendar-container"
          data-testid="calendar-container"
          role="dialog"
          aria-label={t("Date picker")}
        >
          <div className="calendar-header" data-testid="calendar-header">
            <div className="calendar-nav-buttons">
              <span
                className="calendar-prev-year-btn"
                onClick={goToPrevYear}
                onKeyDown={handlePrevYearKeyDown}
                data-testid="calendar-prev-year"
                aria-label={t("Previous year")}
                role="button"
                tabIndex={0}
              >
                <LeftFarIcon />
              </span>
              <span
                className="calendar-prev-month-btn"
                data-testid="calendar-prev-month"
                aria-label={t("Previous month")}
                role="button"
                tabIndex={0}
                onKeyDown={handlePrevMonthKeyDown}
              >
                <AngleLeftIcon onClick={goToPrevMonth} />
              </span>
            </div>
            <span
              className="calendar-month-year"
              data-testid="calendar-month-year"
            >
              {formatMonthYear()}
            </span>
            <div className="calendar-nav-buttons">
              <span
                className="calendar-next-month-btn"
                data-testid="calendar-next-month"
                aria-label={t("Next month")}
                role="button"
                tabIndex={0}
                onKeyDown={handleNextMonthKeyDown}
              >
                <AngleRightIcon onClick={goToNextMonth} />
              </span>
              <span
                className="calendar-next-year-btn"
                onClick={goToNextYear}
                onKeyDown={handleNextYearKeyDown}
                data-testid="calendar-next-year"
                aria-label={t("Next year")}
                role="button"
                tabIndex={0}
              >
                <RightFarIcon />
              </span>
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
            {generateDays().map((dayObj, index) => {
              // Safe checks for all properties
              if (!dayObj || !dayObj.date) return null;

              const selected = isInRange(dayObj.date);
              const isStart = isStartDate(dayObj.date);
              const isEnd = isEndDate(dayObj.date);
              const dayNumber = dayObj.date.getDate();

              const dayClasses = [
                "calendar-day",
                dayObj.isCurrentMonth ? "current-month" : "other-month",
                selected ? "selected" : "",
                isStart ? "start-date" : "",
                isEnd ? "end-date" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={index}
                  onClick={() => handleDateSelect(dayObj.date)}
                  onKeyDown={(e) => handleDateKeyDown(e, dayObj.date)}
                  className={dayClasses}
                  data-testid={`calendar-day-${dayNumber}`}
                  aria-label={`${dayObj.date.toLocaleDateString()}, ${
                    selected ? t("selected") : t("not selected")
                  }`}
                  aria-selected={selected}
                  role="gridcell"
                  tabIndex={0}
                >
                  {dayNumber}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
