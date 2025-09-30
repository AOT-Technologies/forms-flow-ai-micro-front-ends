import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomTextArea } from '../CustomComponents/CustomTextArea';

const meta: Meta<typeof CustomTextArea> = {
  title: 'Components/CustomTextArea',
  component: CustomTextArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable textarea component with accessibility features, character limits, and flexible sizing. Supports disabled state, custom placeholders, and ARIA labels.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Current textarea value',
    },
    setValue: {
      action: 'value-changed',
      description: 'Called when textarea value changes',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the textarea',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the textarea',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
    rows: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Number of visible text lines',
    },
    maxLength: {
      control: { type: 'number', min: 1, max: 1000, step: 1 },
      description: 'Maximum number of characters allowed',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled textarea component
const CustomTextAreaTemplate = (args: any) => {
  const [value, setValue] = useState(args.value || '');

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    action('value-changed')(newValue);
  };

  return (
    <div style={{ width: '500px' }}>
      <CustomTextArea
        {...args}
        value={value}
        setValue={handleValueChange}
      />
    </div>
  );
};

// Basic textarea
export const Default: Story = {
  args: {
    placeholder: 'Enter your text here',
    dataTestId: 'textarea-default',
    disabled: false,
    rows: 4,
  },
  render: CustomTextAreaTemplate,
};

// With initial value
export const WithInitialValue: Story = {
  args: {
    value: 'This is some initial text content that demonstrates how the textarea looks with pre-filled content.',
    placeholder: 'Enter your text here',
    dataTestId: 'textarea-initial',
    disabled: false,
    rows: 4,
  },
  render: CustomTextAreaTemplate,
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    dataTestId: 'textarea-disabled',
    disabled: true,
    rows: 4,
  },
  render: CustomTextAreaTemplate,
};

// With character limit
export const WithCharacterLimit: Story = {
  args: {
    placeholder: 'Enter up to 100 characters',
    dataTestId: 'textarea-limited',
    disabled: false,
    rows: 3,
    maxLength: 100,
  },
  render: CustomTextAreaTemplate,
};

// Large textarea
export const Large: Story = {
  args: {
    placeholder: 'Enter a large amount of text',
    dataTestId: 'textarea-large',
    disabled: false,
    rows: 8,
  },
  render: CustomTextAreaTemplate,
};

// Small textarea
export const Small: Story = {
  args: {
    placeholder: 'Short text',
    dataTestId: 'textarea-small',
    disabled: false,
    rows: 2,
  },
  render: CustomTextAreaTemplate,
};

// With custom ARIA label
export const WithAriaLabel: Story = {
  args: {
    placeholder: 'Enter your message',
    dataTestId: 'textarea-aria',
    disabled: false,
    rows: 4,
    ariaLabel: 'Message composition area for user feedback',
  },
  render: CustomTextAreaTemplate,
};

// Long content example
export const LongContent: Story = {
  args: {
    value: `This is a long text example that demonstrates how the textarea handles substantial content. 

It includes multiple paragraphs and shows how the component behaves with:
- Bullet points
- Line breaks
- Extended text content
- Various formatting

The textarea should handle this content gracefully and provide appropriate scrolling behavior when the content exceeds the visible area.`,
    placeholder: 'Enter your detailed text',
    dataTestId: 'textarea-long',
    disabled: false,
    rows: 6,
  },
  render: CustomTextAreaTemplate,
};

// Form submission example
export const FormExample: Story = {
  args: {
    placeholder: 'Enter your feedback',
    dataTestId: 'textarea-form',
    disabled: false,
    rows: 5,
    maxLength: 500,
  },
  render: CustomTextAreaTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Example of textarea in a form context with character limit for user feedback.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    placeholder: 'Enter your text',
    dataTestId: 'textarea-playground',
    disabled: false,
    rows: 4,
  },
  render: CustomTextAreaTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls to adjust props and observe behavior. Try different row counts, character limits, and disabled states.',
      },
    },
  },
};
