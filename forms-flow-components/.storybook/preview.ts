import type { Preview } from '@storybook/react';
// Load shared theme (includes Bootstrap overrides and Bootstrap itself)
import '../../forms-flow-theme/scss/index.scss';
import './preview.css';
// Import your custom styles if needed
// import '../src/styles/global.scss';

// i18n mock removed; using simple local mock below

// Mock i18n for Storybook since the actual i18n depends on @formsflow/service
const mockI18n = {
  language: 'en',
  changeLanguage: (lng: string) => {
    mockI18n.language = lng;
  },
  t: (key: string) => key, // Simple key return for mocking
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      autodocs: 'tag',
    },
    // Add viewport configurations for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
      },
    },
  },
  globalTypes: {
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', right: '🇺🇸', title: 'English' },
          { value: 'fr', right: '🇫🇷', title: 'Français' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const { locale } = context.globals;
      
      // Change language based on selected locale
      if (mockI18n.language !== locale) {
        mockI18n.changeLanguage(locale);
      }

      return Story();
    },
  ],
};

export default preview;
