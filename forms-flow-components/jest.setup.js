

import "@testing-library/jest-dom";

// Mock `react-i18next` to avoid repetitive mocking in every test
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key, // Mock translation function
  }),
}));