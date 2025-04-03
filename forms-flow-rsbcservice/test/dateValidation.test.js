const moment = require("moment");

// The function to test
function formatValidDate(value, dateFormat = "YYYY-MM-DD") {
  if (
    moment(value, moment.ISO_8601, true).isValid() &&
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(
      value
    )
  ) {
    return moment(value).format(dateFormat);
  }
  return null;
}

// Jest unit tests
describe("Date Format Validation", () => {
  const validDates = [
    { input: "2024-03-27", expected: "2024-03-27" },
    { input: "2024-03-27T12:34:56", expected: "2024-03-27" },
    { input: "2024-03-27T12:34:56Z", expected: "2024-03-27" },
    { input: "2024-03-27T12:34:56.789Z", expected: "2024-03-27" },
    { input: "2024-03-27T12:34:56+05:00", expected: "2024-03-27" },
  ];

  const invalidDates = [
    "20240506", // numbers only that looks like date
    "202405", // numbers that looks like date
    "2024-03", // Year-Month only
    "2024", // Year only
    "2024-W13", // Week number
    "2024-W13-3", // Week and day
    "2024-086", // Ordinal date (day of year)
    "12:34:56Z", // Time only
    "12:34:56+05:00", // Time only with offset
    "12:34:56.789", // Time only with milliseconds
    "03/27/2024", // Non-ISO MM/DD/YYYY
    "27/03/2024", // Non-ISO DD/MM/YYYY
    "March 27, 2024", // Text-based date
    "2024.03.27", // Dots instead of dashes
    "2024-3-27", // Single-digit month
    "2024-03-32", // Invalid day
    "2024-13-01", // Invalid month
  ];

  test.each(validDates)("Valid date: %s", ({ input, expected }) => {
    expect(formatValidDate(input)).toBe(expected);
  });

  test.each(invalidDates)("Invalid date: %s", (input) => {
    expect(formatValidDate(input)).toBeNull();
  });
});
