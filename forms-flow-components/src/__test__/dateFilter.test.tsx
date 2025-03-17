import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DateRangePicker } from "../components/CustomComponents/DateFilter";

// Mock the translation function
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (key) => key,
      i18n: {
        changeLanguage: jest.fn(),
      },
    };
  },
}));

describe("DateRangePicker component", () => {
  it("renders with default props", () => {
    const { container } = render(<DateRangePicker />);
    expect(
      container.querySelector(".date-range-picker-container")
    ).toBeInTheDocument();
    expect(screen.getByTestId("date-range-display")).toBeInTheDocument();
    expect(screen.getByTestId("date-range-text")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<DateRangePicker className="custom-class" />);
    expect(container.querySelector(".date-range-picker-container")).toHaveClass(
      "custom-class"
    );
  });

  it("opens calendar when clicked", () => {
    render(<DateRangePicker />);

    // Calendar should be closed initially
    expect(screen.queryByTestId("calendar-container")).not.toBeInTheDocument();

    // Click to open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    // Calendar should now be open
    expect(screen.getByTestId("calendar-container")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-header")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-days")).toBeInTheDocument();
  });

  it("closes calendar when close button is clicked", () => {
    render(<DateRangePicker />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));
    expect(screen.getByTestId("calendar-container")).toBeInTheDocument();

    // Click close button
    fireEvent.click(screen.getByTestId("date-range-close-btn"));

    // Calendar should be closed
    expect(screen.queryByTestId("calendar-container")).not.toBeInTheDocument();
  });

  it("accepts and displays initial date range", () => {
    const initialDateRange = {
      startDate: "2025-03-01T00:00:00+00:00",
      endDate: "2025-03-15T00:00:00+00:00",
    };

    render(<DateRangePicker initialDateRange={initialDateRange} />);

    // Should display date range in the format MM/DD/YYYY - MM/DD/YYYY
    expect(screen.getByTestId("date-range-text").textContent).toContain(
      "03/01/2025 - 03/15/2025"
    );
  });

  it("accepts ISO date format strings", () => {
    const initialDateRange = {
      startDate: "2025-03-12T11:49:57+00:00",
      endDate: "2025-04-12T11:49:57+00:00",
    };

    render(<DateRangePicker initialDateRange={initialDateRange} />);

    // Should properly parse and display ISO format dates
    expect(screen.getByTestId("date-range-text").textContent).toContain(
      "03/12/2025 - 04/12/2025"
    );
  });

  it("shows correct month and year in calendar header", () => {
    const initialDateRange = {
      startDate: "2025-05-15T00:00:00+00:00",
      endDate: "2025-05-20T00:00:00+00:00",
    };

    render(<DateRangePicker initialDateRange={initialDateRange} />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    // Should show May 2025 in the header
    expect(screen.getByTestId("calendar-month-year").textContent).toBe(
      "May 2025"
    );
  });

  it("navigates to previous year when previous year button is clicked", () => {
    const initialDateRange = {
      startDate: "2025-03-01T00:00:00+00:00",
      endDate: "2025-03-15T00:00:00+00:00",
    };

    render(<DateRangePicker initialDateRange={initialDateRange} />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    // Click previous year button
    fireEvent.click(screen.getByTestId("calendar-prev-year"));

    // Should now be March 2024
    expect(screen.getByTestId("calendar-month-year").textContent).toBe(
      "March 2024"
    );
  });

  it("calls onChange callback when dates are selected", async () => {
    const mockOnChange = jest.fn();

    render(<DateRangePicker onChange={mockOnChange} />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    // Select start date (day 10)
    const startDay = screen.getByTestId("calendar-day-10");
    fireEvent.click(startDay);

    // Select end date (day 20)
    const endDay = screen.getByTestId("calendar-day-20");
    fireEvent.click(endDay);

    // onChange should be called with the selected date range
    expect(mockOnChange).toHaveBeenCalledTimes(1);

    // Check that the callback received a date range object
    const dateRange = mockOnChange.mock.calls[0][0];
    expect(dateRange).toHaveProperty("startDate");
    expect(dateRange).toHaveProperty("endDate");

    // Both dates should be Date objects
    expect(dateRange.startDate instanceof Date).toBe(true);
    expect(dateRange.endDate instanceof Date).toBe(true);
  });

  it("selects dates in reverse order if end date is clicked before start date", () => {
    const mockOnChange = jest.fn();

    render(<DateRangePicker onChange={mockOnChange} />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    // Select day 20 first
    const laterDay = screen.getByTestId("calendar-day-20");
    fireEvent.click(laterDay);

    // Then select day 10
    const earlierDay = screen.getByTestId("calendar-day-10");
    fireEvent.click(earlierDay);

    // Get the date range passed to onChange
    const dateRange = mockOnChange.mock.calls[0][0];

    // The start date should be day 10 (the earlier date)
    expect(dateRange.startDate.getDate()).toBe(10);
    // The end date should be day 20 (the later date)
    expect(dateRange.endDate.getDate()).toBe(20);
  });

  it("highlights selected date range in the calendar", () => {
    render(<DateRangePicker />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    // Select day 10
    const startDay = screen.getByTestId("calendar-day-10");
    fireEvent.click(startDay);

    // It should have the start-date class
    expect(startDay).toHaveClass("start-date");

    // Select day 15
    const endDay = screen.getByTestId("calendar-day-15");
    fireEvent.click(endDay);

    // End day should have the end-date class
    expect(endDay).toHaveClass("end-date");

    // All days in between should have the selected class
    const day12 = screen.getByTestId("calendar-day-12");
    expect(day12).toHaveClass("selected");
  });

  it("displays weekday headers", () => {
    render(<DateRangePicker />);

    // Open calendar
    fireEvent.click(screen.getByTestId("date-range-display"));

    const weekdays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

    // Check that all weekdays are displayed
    weekdays.forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });
});
