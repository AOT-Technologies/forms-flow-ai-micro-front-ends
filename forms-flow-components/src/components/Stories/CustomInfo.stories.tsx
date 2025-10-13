import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CustomInfo } from '../CustomComponents/CustomInfo';

const meta: Meta<typeof CustomInfo> = {
  title: 'Components/CustomInfo',
  component: CustomInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'An informational panel component that displays a heading and content with an info icon. Supports multi-line content with line breaks and translation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'The main content text. Use \\n for line breaks'
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'warning'],
      description: 'Visual variant of the info panel'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for custom styling'
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing'
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a simple informational message.',
    variant: 'primary',
    dataTestId: 'default-info',
  },
};

export const PrimaryVariant: Story = {
  args: {
    content: 'Primary info panel with default styling.',
    variant: 'primary',
    dataTestId: 'primary-info',
  },
};

export const SecondaryVariant: Story = {
  args: {
    content: 'Secondary info panel with neutral styling.',
    variant: 'secondary',
    dataTestId: 'secondary-info',
  },
};

export const ErrorVariant: Story = {
  args: {
    content: 'Error info panel for critical information.\nPlease review the error and try again.',
    variant: 'error',
    dataTestId: 'error-info',
  },
};

export const WarningVariant: Story = {
  args: {
    content: 'Warning info panel for cautionary information.\nProceed with caution.',
    variant: 'warning',
    dataTestId: 'warning-info',
  },
};

export const WithMultilineContent: Story = {
  args: {
    content: 'This is the first line of information.\nThis is the second line.\nThis is the third line with more details.',
    dataTestId: 'multiline-info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates multi-line content using \\n line breaks.',
      },
    },
  },
};

export const ShortMessage: Story = {
  args: {
    content: 'Quick tip here!',
    dataTestId: 'short-info',
  },
};

export const LongContent: Story = {
  args: {
    content: 'This is a longer informational message that contains more detailed instructions for the user.\nPlease read carefully before proceeding.\nMake sure all requirements are met.\nContact support if you need assistance.',
    dataTestId: 'long-info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Info panel with longer, more detailed content across multiple lines.',
      },
    },
  },
};

export const HelpText: Story = {
  args: {
    content: 'Step 1: Fill in all required fields\nStep 2: Review your information\nStep 3: Click submit to continue',
    dataTestId: 'help-info',
  },
};

export const WarningInstructions: Story = {
  args: {
    content: 'Please ensure you have saved your work.\nThis action cannot be undone.\nMake sure you have proper permissions.',
    dataTestId: 'warning-info',
  },
};

export const SystemRequirements: Story = {
  args: {
    content: 'Minimum Browser Version: Chrome 90+\nInternet Connection Required\nCookies Must Be Enabled\nJavaScript Required',
    dataTestId: 'requirements-info',
  },
};

export const SingleLineWithCustomClass: Story = {
  args: {
    content: 'This info panel has custom styling applied.',
    className: 'custom-info-style',
    dataTestId: 'custom-class-info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Info panel with custom CSS class for additional styling.',
      },
    },
  },
};

export const FormFieldHelp: Story = {
  args: {
    content: 'Password must be at least 8 characters\nMust contain at least one number\nMust contain at least one special character',
    dataTestId: 'field-help-info',
  },
};

export const FeatureAnnouncement: Story = {
  args: {
    content: 'We have added new functionality to enhance your experience.\nCheck out the updated documentation for more details.\nFeedback is welcome!',
    dataTestId: 'announcement-info',
  },
};

export const PrivacyNotice: Story = {
  args: {
    content: 'Your data is encrypted and secure.\nWe do not share your information with third parties.\nYou can request data deletion at any time.',
    dataTestId: 'privacy-info',
  },
};

export const AccessibilityInfo: Story = {
  args: {
    content: 'Screen reader compatible\nKeyboard navigation supported\nHigh contrast mode available',
    dataTestId: 'accessibility-info',
  },
};

export const EmptyContent: Story = {
  args: {
    content: '',
    dataTestId: 'empty-info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Info panel with only a heading and no content.',
      },
    },
  },
};

// Multiple info panels example
export const MultipleInfoPanels: Story = {
  render: () => {
    const infoPanels = [
      {
        id: 'info-panel-001',
        content: 'Welcome to the application!\nFollow these steps to begin.',
        dataTestId: 'getting-started-info',
      },
      {
        id: 'info-panel-002',
        content: 'Use keyboard shortcuts for faster navigation\nSave frequently to prevent data loss',
        dataTestId: 'tips-info',
      },
      {
        id: 'info-panel-003',
        content: 'Need help? Contact our support team\nEmail: support@example.com\nPhone: 1-800-SUPPORT',
        dataTestId: 'support-info',
      },
    ];

    return (
      <div style={{ width: '100%', maxWidth: '1800px' }}>
        {infoPanels.map((info) => (
          <div key={info.id} style={{ marginBottom: '16px' }}>
            <CustomInfo {...info} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple info panels stacked vertically.',
      },
    },
  },
};

// All variants example
export const AllVariants: Story = {
  render: () => {
    const variants = [
      {
        variant: 'primary' as const,
        content: 'Primary: General informational content',
      },
      {
        variant: 'secondary' as const,
        content: 'Secondary: Neutral informational content',
      },
      {
        variant: 'error' as const,
        content: 'Error: Critical information requiring attention',
      },
      {
        variant: 'warning' as const,
        content: 'Warning: Cautionary information',
      },
    ];

    return (
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {variants.map((info, index) => (
          <div key={index} style={{ marginBottom: '16px' }}>
            <CustomInfo {...info} dataTestId={`${info.variant}-info`} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all available info panel variants.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  args: {
    content: 'Edit the controls below to customize this info panel.\nYou can change the content and styling.',
    variant: 'primary',
    className: '',
    dataTestId: 'playground-info',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all info panel properties and see how they affect the component.',
      },
    },
  },
};


