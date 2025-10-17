import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { V8CustomButton } from '../CustomComponents/CustomButton';

const meta: Meta<typeof V8CustomButton> = {
  title: 'Components/CustomButton',
  component: V8CustomButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile, accessible button component with multiple variants, states, and size options. Built with TypeScript, React.memo, and forwardRef for optimal performance and composability.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { 
      control: 'select', 
      options: ['primary', 'secondary', 'error', 'warning'],
      description: 'Button visual style variant'
    },
    size: { 
      control: 'select', 
      options: ['small', 'medium', 'large'],
      description: 'Button size affecting padding and font size'
    },
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type'
    },
    loading: {
      control: 'boolean',
      description: 'Shows spinner and disables interaction'
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button'
    },
    selected: {
      control: 'boolean',
      description: 'Selected/active state for toggle buttons'
    },
    iconOnly: {
      control: 'boolean',
      description: 'Icon-only button (hides text label)'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button'
    },
    label: {
      control: 'text',
      description: 'Button text label'
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers'
    },
    loadingText: {
      control: 'text',
      description: 'Custom text shown during loading state'
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    // Exclude complex props from controls
    icon: {
      control: 'text',
      description: 'Icon element to display'
    },
    onClick: { 
      action: 'clicked',
      description: 'Click handler function'
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    onClick: action('primary-clicked'),
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    onClick: action('secondary-clicked'),
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Delete',
    variant: 'error',
    onClick: action('error-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error variant for destructive actions like delete, remove, or cancel operations.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    label: 'Proceed with Caution',
    variant: 'warning',
    onClick: action('warning-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning variant for actions that require user attention or caution before proceeding.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    label: 'Loading Button',
    loading: true,
    variant: 'primary',
    loadingText: 'Loading...',
    onClick: action('loading-button-clicked'),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    disabled: true,
    variant: 'primary',
    onClick: action('disabled-button-clicked'),
  },
};

export const IconOnly: Story = {
  args: {
    icon: <span>⚙️</span>,
    iconOnly: true,
    ariaLabel: 'Settings',
    variant: 'primary',
    onClick: action('icon-only-clicked'),
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Save Document',
    icon: <span>💾</span>,
    variant: 'primary',
    onClick: action('save-clicked'),
  },
};

export const IconOnlyLoading: Story = {
  args: {
    icon: <span>⚙️</span>,
    iconOnly: true,
    ariaLabel: 'Settings',
    loading: true,
    variant: 'primary',
    onClick: action('icon-only-loading-clicked'),
  },
};


export const Selected: Story = {
  args: {
    label: 'Toggle Feature',
    selected: true,
    variant: 'primary',
    onClick: action('toggle-clicked'),
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Full Width Button',
    fullWidth: true,
    variant: 'primary',
    onClick: action('fullwidth-clicked'),
  },
  parameters: {
    layout: 'padded', // Show full width in padded container
  },
};


export const DisabledWithIcon: Story = {
  args: {
    label: 'Upload File',
    icon: <span>📁</span>,
    disabled: true,
    variant: 'secondary',
    onClick: action('upload-clicked'),
  },
};


// Interactive playground story
export const Playground: Story = {
  args: {
    label: 'Interactive Button',
    variant: 'primary',
    size: 'medium',
    type: 'button',
    loading: false,
    disabled: false,
    selected: false,
    iconOnly: false,
    fullWidth: false,
    dataTestId: 'playground-button',
    onClick: action('playground-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all button properties and see how they affect the component.',
      },
    },
  },
};