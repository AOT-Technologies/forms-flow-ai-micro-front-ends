import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Alert, AlertVariant } from '../CustomComponents/Alert';
import { V8CustomButton } from '../CustomComponents/CustomButton';
import { CustomProgressBar } from '../CustomComponents/ProgressBar';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile alert component with multiple variants for displaying messages to users. Supports different alert types (passive, focus, error, warning) with optional right content and show/hide functionality.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Alert message text to display'
    },
    variant: {
      control: 'select',
      options: Object.values(AlertVariant),
      description: 'Alert visual style variant'
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing'
    },
    rightContent: {
      control: 'text',
      description: 'Additional content to display on the right side'
    },
    isShowing: {
      control: 'boolean',
      description: 'Controls whether the alert is visible'
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Focus: Story = {
  args: {
    message: 'This is a focus alert message',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'focus-alert',
  },
};

export const Error: Story = {
  args: {
    message: 'This is an error alert message',
    variant: AlertVariant.ERROR,
    isShowing: true,
    dataTestId: 'error-alert',
  },
};

export const Warning: Story = {
  args: {
    message: 'This is a warning alert message',
    variant: AlertVariant.WARNING,
    isShowing: true,
    dataTestId: 'warning-alert',
  },
};

export const Passive: Story = {
  args: {
    message: 'This is a passive alert message',
    variant: AlertVariant.PASSIVE,
    isShowing: true,
    dataTestId: 'passive-alert',
  },
};

export const WithRightContent: Story = {
  args: {
    message: 'Alert with action button',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'alert-with-action',
    rightContent: (
      <V8CustomButton
        label="Dismiss"
        variant="secondary"
        size="small"
        onClick={action('dismiss-clicked')}
        dataTestId="dismiss-button"
      />
    ),
  },
};

export const WithMultipleActions: Story = {
  args: {
    message: 'Alert with multiple actions',
    variant: AlertVariant.WARNING,
    isShowing: true,
    dataTestId: 'alert-with-actions',
    rightContent: (
      <div style={{ display: 'flex', gap: '8px' }}>
        <V8CustomButton
          label="Cancel"
          variant="secondary"
          size="small"
          onClick={action('cancel-clicked')}
          dataTestId="cancel-button"
        />
        <V8CustomButton
          label="Confirm"
          variant="primary"
          size="small"
          onClick={action('confirm-clicked')}
          dataTestId="confirm-button"
        />
      </div>
    ),
  },
};

export const LongMessage: Story = {
  args: {
    message: 'This is a very long alert message that should wrap properly and display correctly across multiple lines without breaking the layout or causing any visual issues.',
    variant: AlertVariant.ERROR,
    isShowing: true,
    dataTestId: 'long-message-alert',
  },
};

export const Hidden: Story = {
  args: {
    message: 'This alert is hidden',
    variant: AlertVariant.FOCUS,
    isShowing: false,
    dataTestId: 'hidden-alert',
  },
};

export const WithIcon: Story = {
  args: {
    message: 'Alert with icon content',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'alert-with-icon',
    rightContent: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>ℹ️</span>
        <span>Info</span>
      </div>
    ),
  },
};

export const WithCustomContent: Story = {
  args: {
    message: 'Alert with custom right content',
    variant: AlertVariant.WARNING,
    isShowing: true,
    dataTestId: 'alert-custom-content',
    rightContent: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>2 min ago</span>
        <button 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
          onClick={action('close-clicked')}
        >
          ✕
        </button>
      </div>
    ),
  },
};

export const WithProgressBar: Story = {
  args: {
    message: 'Upload in progress...',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'alert-with-progress',
    rightContent: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
        <CustomProgressBar 
          progress={65}
          color="default"
          height="8px"
          minWidth="150px"
          dataTestId="upload-progress"
          ariaLabel="Upload progress"
        />
        <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>65%</span>
      </div>
    ),
  },
};

export const WithErrorProgressBar: Story = {
  args: {
    message: 'Upload failed - retrying...',
    variant: AlertVariant.ERROR,
    isShowing: true,
    dataTestId: 'alert-error-progress',
    rightContent: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
        <CustomProgressBar 
          progress={30}
          color="error"
          height="8px"
          minWidth="150px"
          dataTestId="error-progress"
          ariaLabel="Retry progress"
        />
        <V8CustomButton
          label="Cancel"
          variant="secondary"
          size="small"
          onClick={action('cancel-upload')}
          dataTestId="cancel-upload-button"
        />
      </div>
    ),
  },
};

// Template for controlled component
const AlertTemplate = (args: any) => {
  return (
    <div style={{ width: '100%', maxWidth: '1600px' }}>
      <Alert {...args} style={{ width: '100%' }} />
    </div>
  );
};

// Multiple alerts example
export const MultipleAlerts: Story = {
  render: () => {
    const alerts = [
      {
        message: 'System maintenance scheduled for tonight',
        variant: AlertVariant.WARNING,
        isShowing: true,
        dataTestId: 'maintenance-alert',
      },
      {
        message: 'Your changes have been saved successfully',
        variant: AlertVariant.FOCUS,
        isShowing: true,
        dataTestId: 'success-alert',
      },
      {
        message: 'Failed to connect to server',
        variant: AlertVariant.ERROR,
        isShowing: true,
        dataTestId: 'error-alert',
        rightContent: (
          <V8CustomButton
            label="Retry"
            variant="secondary"
            size="small"
            onClick={action('retry-clicked')}
            dataTestId="retry-button"
          />
        ),
      },
    ];

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        {alerts.map((alert, index) => (
          <div key={index} style={{ marginBottom: '12px', width: '100%' }}>
            <Alert {...alert} />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple alerts stacked vertically.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  args: {
    message: 'Interactive alert message',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'playground-alert',
  },
  render: AlertTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all alert properties and see how they affect the component.',
      },
    },
  },
};
