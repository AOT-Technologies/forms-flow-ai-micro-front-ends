// Mock implementation of @formsflow/service for Storybook
export const StorageService = {
  User: {
    USER_DETAILS: 'user_details'
  },
  getParsedData: (key) => {
    // Return mock user data for Storybook
    if (key === 'user_details') {
      return {
        id: 'mock-user-id',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User',
        username: 'mockuser',
        role: 'admin'
      };
    }
    return {};
  }
};

export const StyleServices = {
  getCSSVariable: (variableName) => {
    // Get CSS variable from document root
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
    }
    return '';
  }
};

export const i18nService = {
  use: function() {
    return this; // Return this for method chaining
  },
  init: function() {
    return this; // Return this for method chaining
  }
};

// Export default for compatibility
export default {
  StorageService,
  StyleServices,
  i18nService
};
