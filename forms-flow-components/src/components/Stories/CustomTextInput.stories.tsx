import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomTextInput } from '../CustomComponents/CustomTextInput';

const meta: Meta<typeof CustomTextInput> = {
  title: 'Components/CustomTextInput',
  component: CustomTextInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable text input component with accessibility features and flexible styling. Supports disabled state, custom placeholders, and ARIA labels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current input value',
    },
    setValue: {
      action: 'value-changed',
      description: 'Called when input value changes',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled text input component
const CustomTextInputTemplate = (args: any) => {
  const [value, setValue] = useState(args.value || '');

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    action('value-changed')(newValue);
  };

  return (
    <div style={{ width: '500px' }}>
      <CustomTextInput
        {...args}
        value={value}
        setValue={handleValueChange}
      />
    </div>
  );
};

// Basic text input
export const Default: Story = {
  args: {
    placeholder: 'Enter your text here',
    dataTestId: 'text-input-default',
    disabled: false,
  },
  render: CustomTextInputTemplate,
};

// With initial value
export const WithInitialValue: Story = {
  args: {
    value: 'Initial text content',
    placeholder: 'Enter your text here',
    dataTestId: 'text-input-initial',
    disabled: false,
  },
  render: CustomTextInputTemplate,
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: 'This input is disabled',
    dataTestId: 'text-input-disabled',
    disabled: true,
  },
  render: CustomTextInputTemplate,
};

// With custom ARIA label
export const WithAriaLabel: Story = {
  args: {
    placeholder: 'Enter your name',
    dataTestId: 'text-input-aria',
    disabled: false,
    ariaLabel: 'Full name input field for user registration',
  },
  render: CustomTextInputTemplate,
};

// Email input example
export const EmailInput: Story = {
  args: {
    placeholder: 'Enter your email address',
    dataTestId: 'text-input-email',
    disabled: false,
    ariaLabel: 'Email address for account registration',
  },
  render: CustomTextInputTemplate,
};

// Username input example
export const UsernameInput: Story = {
  args: {
    placeholder: 'Choose a username',
    dataTestId: 'text-input-username',
    disabled: false,
    ariaLabel: 'Username for your account',
  },
  render: CustomTextInputTemplate,
};

// Search input example
export const SearchInput: Story = {
  args: {
    placeholder: 'Search for products, users, or content...',
    dataTestId: 'text-input-search',
    disabled: false,
    ariaLabel: 'Search input for finding content',
  },
  render: CustomTextInputTemplate,
};

// Long placeholder text
export const LongPlaceholder: Story = {
  args: {
    placeholder: 'Enter a very long description or detailed information about your request',
    dataTestId: 'text-input-long',
    disabled: false,
  },
  render: CustomTextInputTemplate,
};

// Form field example
export const FormField: Story = {
  args: {
    placeholder: 'Enter your full name',
    dataTestId: 'text-input-form',
    disabled: false,
    ariaLabel: 'Full name field for contact form',
  },
  render: CustomTextInputTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Example of text input in a form context with proper accessibility labels.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    placeholder: 'Enter your text',
    dataTestId: 'text-input-playground',
    disabled: false,
  },
  render: CustomTextInputTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls to adjust props and observe behavior. Try different placeholder texts, disabled states, and ARIA labels.',
      },
    },
  },
};
