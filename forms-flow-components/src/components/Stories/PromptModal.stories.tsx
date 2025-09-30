import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { PromptModal } from '../CustomComponents/PromptModal';

const meta: Meta<typeof PromptModal> = {
  title: 'Components/PromptModal',
  component: PromptModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile modal component for displaying prompts, confirmations, and alerts. Supports multiple types (info, warning, success, error) with customizable buttons and loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    show: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    type: {
      control: 'select',
      options: ['info', 'warning', 'success', 'error'],
      description: 'Modal type affecting icon and styling',
    },
    title: {
      control: 'text',
      description: 'Modal title (translation key)',
    },
    message: {
      control: 'text',
      description: 'Modal message content (translation key)',
    },
    primaryBtnText: {
      control: 'text',
      description: 'Primary button text (translation key)',
    },
    secondaryBtnText: {
      control: 'text',
      description: 'Secondary button text (translation key)',
    },
    btnText: {
      control: 'text',
      description: 'Third button text (translation key)',
    },
    primaryBtnDisable: {
      control: 'boolean',
      description: 'Disables primary button',
    },
    secondaryBtnDisable: {
      control: 'boolean',
      description: 'Disables secondary button',
    },
    btnDisable: {
      control: 'boolean',
      description: 'Disables third button',
    },
    buttonLoading: {
      control: 'boolean',
      description: 'Shows loading state on primary button',
    },
    secondaryBtnLoading: {
      control: 'boolean',
      description: 'Shows loading state on secondary button',
    },
    btnLoading: {
      control: 'boolean',
      description: 'Shows loading state on third button',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled modal
const PromptModalTemplate = (args: any) => {
  const [show, setShow] = useState(args.show || false);

  const handleClose = () => {
    setShow(false);
    action('modal-closed')();
  };

  const handlePrimaryAction = () => {
    action('primary-action')();
    setShow(false);
  };

  const handleSecondaryAction = () => {
    action('secondary-action')();
    setShow(false);
  };

  const handleThirdAction = () => {
    action('third-action')();
    setShow(false);
  };

  return (
    <div>
      <button
        onClick={() => setShow(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Open Modal
      </button>
      <PromptModal
        {...args}
        show={show}
        onClose={handleClose}
        primaryBtnAction={handlePrimaryAction}
        secondaryBtnAction={handleSecondaryAction}
        btnAction={handleThirdAction}
      />
    </div>
  );
};

// Basic modal types
export const InfoModal: Story = {
  args: {
    show: false,
    type: 'info',
    title: 'Information',
    message: 'This is an informational message to the user.',
    primaryBtnText: 'OK',
    secondaryBtnText: 'Cancel',
  },
  render: PromptModalTemplate,
};

export const WarningModal: Story = {
  args: {
    show: false,
    type: 'warning',
    title: 'Warning',
    message: 'This action cannot be undone. Are you sure you want to continue?',
    primaryBtnText: 'Continue',
    secondaryBtnText: 'Cancel',
  },
  render: PromptModalTemplate,
};

export const SuccessModal: Story = {
  args: {
    show: false,
    type: 'success',
    title: 'Success',
    message: 'Your changes have been saved successfully.',
    primaryBtnText: 'OK',
  },
  render: PromptModalTemplate,
};

export const ErrorModal: Story = {
  args: {
    show: false,
    type: 'error',
    title: 'Error',
    message: 'Something went wrong. Please try again.',
    primaryBtnText: 'Retry',
    secondaryBtnText: 'Cancel',
  },
  render: PromptModalTemplate,
};

// Loading states
export const LoadingModal: Story = {
  args: {
    show: false,
    type: 'info',
    title: 'Processing',
    message: 'Please wait while we process your request...',
    primaryBtnText: 'Processing',
    secondaryBtnText: 'Cancel',
    buttonLoading: true,
    primaryBtnDisable: true,
  },
  render: PromptModalTemplate,
};

// Disabled states
export const DisabledButtonsModal: Story = {
  args: {
    show: false,
    type: 'warning',
    title: 'Confirmation Required',
    message: 'Some buttons are disabled in this example.',
    primaryBtnText: 'Primary',
    secondaryBtnText: 'Secondary',
    primaryBtnDisable: true,
    btnDisable: true,
  },
  render: PromptModalTemplate,
};

// Minimal modal (no message)
export const MinimalModal: Story = {
  args: {
    show: false,
    type: 'info',
    title: 'Simple Confirmation',
    primaryBtnText: 'OK',
  },
  render: PromptModalTemplate,
};

// Long content modal
export const LongContentModal: Story = {
  args: {
    show: false,
    type: 'info',
    title: 'Terms and Conditions',
    message: 'This is a very long message that demonstrates how the modal handles extended content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    primaryBtnText: 'I Agree',
    secondaryBtnText: 'Decline',
  },
  render: PromptModalTemplate,
};

// Interactive playground
export const Playground: Story = {
  args: {
    show: false,
    type: 'info',
    title: 'Custom Modal',
    message: 'Customize this modal using the controls below.',
    primaryBtnText: 'Primary',
    secondaryBtnText: 'Secondary'
  },
  render: PromptModalTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls to adjust props and observe behavior. Try different modal types, button combinations, and loading states.',
      },
    },
  },
};
