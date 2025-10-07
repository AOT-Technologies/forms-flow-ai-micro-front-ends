import React from 'react';
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

// Reusable hook for button click tracking
const useButtonClickTracker = () => {
  const [lastClickedButton, setLastClickedButton] = React.useState<string | null>(null);
  
  const trackClick = React.useCallback((buttonName: string, originalAction: () => void) => {
    setLastClickedButton(buttonName);
    originalAction();
  }, []);

  const resetClick = React.useCallback(() => {
    setLastClickedButton(null);
  }, []);

  return { lastClickedButton, trackClick, resetClick };
};

// Reusable component for visual feedback
const ButtonClickFeedback = ({ lastClickedButton }: { lastClickedButton: string | null }) => {
  if (!lastClickedButton) return null;
  
  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '10px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '4px',
      border: '1px solid #ddd'
    }}>
      <strong>Last Button Clicked:</strong> {lastClickedButton}
    </div>
  );
};

// Helper function to create button click handlers
const createButtonHandler = (buttonName: string, actionName: string, trackClick: (name: string, action: () => void) => void) => {
  return () => trackClick(buttonName, () => action(actionName)());
};

// Template to track button clicks and show them visually
const InteractiveAlertTemplate = (args: any) => {
  const { lastClickedButton, trackClick } = useButtonClickTracker();

  return (
    <div style={{ width: '100%', maxWidth: '1600px' }}>
      <Alert {...args} />
      <ButtonClickFeedback lastClickedButton={lastClickedButton} />
    </div>
  );
};

export const Focus: Story = {
  args: {
    message: 'This is a focus alert message',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'focus-alert',
  },
};

export const ErrorAlert: Story = {
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
  },
  render: (args) => {
    const { lastClickedButton, trackClick } = useButtonClickTracker();

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        <Alert 
          {...args} 
          rightContent={
            <V8CustomButton
              label="Dismiss"
              variant="secondary"
              size="small"
              onClick={createButtonHandler('Dismiss', 'dismiss-clicked', trackClick)}
              dataTestId="dismiss-button"
            />
          }
        />
        <ButtonClickFeedback lastClickedButton={lastClickedButton} />
      </div>
    );
  },
};

export const WithMultipleActions: Story = {
  args: {
    message: 'Alert with multiple actions',
    variant: AlertVariant.WARNING,
    isShowing: true,
    dataTestId: 'alert-with-actions',
  },
  render: (args) => {
    const { lastClickedButton, trackClick } = useButtonClickTracker();

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        <Alert 
          {...args} 
          rightContent={
            <div style={{ display: 'flex', gap: '8px' }}>
              <V8CustomButton
                label="Cancel"
                variant="secondary"
                size="small"
                onClick={createButtonHandler('Cancel', 'cancel-clicked', trackClick)}
                dataTestId="cancel-button"
              />
              <V8CustomButton
                label="Confirm"
                variant="primary"
                size="small"
                onClick={createButtonHandler('Confirm', 'confirm-clicked', trackClick)}
                dataTestId="confirm-button"
              />
            </div>
          }
        />
        <ButtonClickFeedback lastClickedButton={lastClickedButton} />
      </div>
    );
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
  },
  render: (args) => {
    const { lastClickedButton, trackClick } = useButtonClickTracker();

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        <Alert 
          {...args} 
          rightContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>2 min ago</span>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                onClick={createButtonHandler('Close', 'close-button-clicked', trackClick)}
              >
                ✕
              </button>
            </div>
          }
        />
        <ButtonClickFeedback lastClickedButton={lastClickedButton} />
      </div>
    );
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
  },
  render: (args) => {
    const { lastClickedButton, trackClick } = useButtonClickTracker();

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        <Alert 
          {...args} 
          rightContent={
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
                onClick={createButtonHandler('Cancel Upload', 'cancel-upload-clicked', trackClick)}
                dataTestId="cancel-upload-button"
              />
            </div>
          }
        />
        <ButtonClickFeedback lastClickedButton={lastClickedButton} />
      </div>
    );
  },
};

export const InteractiveButtons: Story = {
  args: {
    message: 'Alert with multiple interactive buttons - check Actions panel',
    variant: AlertVariant.FOCUS,
    isShowing: true,
    dataTestId: 'interactive-alert',
  },
  render: (args) => {
    const { lastClickedButton, trackClick } = useButtonClickTracker();

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        <Alert 
          {...args} 
          rightContent={
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <V8CustomButton
                label="Save"
                variant="primary"
                size="small"
                onClick={createButtonHandler('Save', 'save-button-clicked', trackClick)}
                dataTestId="save-button"
              />
              <V8CustomButton
                label="Edit"
                variant="secondary"
                size="small"
                onClick={createButtonHandler('Edit', 'edit-button-clicked', trackClick)}
                dataTestId="edit-button"
              />
              <V8CustomButton
                label="Delete"
                variant="secondary"
                size="small"
                onClick={createButtonHandler('Delete', 'delete-button-clicked', trackClick)}
                dataTestId="delete-button"
              />
              <button
                style={{
                  background: 'none',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={createButtonHandler('Custom', 'custom-button-clicked', trackClick)}
              >
                Custom
              </button>
            </div>
          }
        />
        <ButtonClickFeedback lastClickedButton={lastClickedButton} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates various button interactions. Click any button and see the events tracked both in the Actions panel and in the visual feedback below.',
      },
    },
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
        id: 'maintenance-alert-001',
        message: 'System maintenance scheduled for tonight',
        variant: AlertVariant.WARNING,
        isShowing: true,
        dataTestId: 'maintenance-alert',
      },
      {
        id: 'success-alert-002',
        message: 'Your changes have been saved successfully',
        variant: AlertVariant.FOCUS,
        isShowing: true,
        dataTestId: 'success-alert',
      },
      {
        id: 'error-alert-003',
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
        {alerts.map((alert) => (
          <div key={alert.id} style={{ marginBottom: '12px', width: '100%' }}>
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
  render: (args) => {
    const { lastClickedButton, trackClick } = useButtonClickTracker();

    return (
      <div style={{ width: '100%', maxWidth: '1600px' }}>
        <Alert 
          {...args} 
          rightContent={
            <V8CustomButton
              label="Action"
              variant="secondary"
              size="small"
              onClick={createButtonHandler('Action', 'playground-button-clicked', trackClick)}
              dataTestId="playground-button"
            />
          }
        />
        <ButtonClickFeedback lastClickedButton={lastClickedButton} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all alert properties and see how they affect the component. Click the action button to see events tracked both in the Actions panel and in the visual feedback below.',
      },
    },
  },
};
