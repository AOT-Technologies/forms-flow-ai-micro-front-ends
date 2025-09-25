import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomRadioButton } from '../CustomComponents/Radio';

const meta: Meta<typeof CustomRadioButton> = {
  title: 'Components/CustomRadioButton',
  component: CustomRadioButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible radio group with fieldset/legend, i18n labels, inline layout, per-option/group disabled, and controlled value support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual style variant',
    },
    items: {
      control: 'object',
      description: 'Array of radio options { label, value, disabled?, onClick? }',
    },
    name: {
      control: 'text',
      description: 'Shared name for the radio group',
    },
    legend: {
      control: 'text',
      description: 'Visible group label rendered as <legend>',
    },
    label: {
      control: 'text',
      description: 'Alias for legend (backward compatibility)',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label when no legend is provided',
    },
    selectedValue: {
      control: 'text',
      description: 'Currently selected value (controlled)',
    },
    inline: {
      control: 'boolean',
      description: 'Display radios inline (horizontal)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the entire group',
    },
    required: {
      control: 'boolean',
      description: 'Mark the group as required',
    },
    optionClassName: {
      control: 'text',
      description: 'Additional class for each option wrapper',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID prefix for automated testing',
    },
    onChange: {
      action: 'changed',
      description: 'Called with (value, event) when selection changes',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const sampleItems = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
];

// Template to keep the component controlled for interactive stories
const ControlledTemplate = (args: any) => {
  const [selectedValue, setSelectedValue] = React.useState(args.selectedValue);
  return (
    <CustomRadioButton
      {...args}
      selectedValue={selectedValue}
      onChange={(value: any, event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(value);
        // Forward to provided action handler if any
        if (typeof args.onChange === 'function') {
          args.onChange(value, event);
        } else {
          action('changed')(value, event);
        }
      }}
    />
  );
};

export const Basic: Story = {
  args: {
    name: 'demo-radio',
    legend: 'Choose an option',
    items: sampleItems,
    selectedValue: 'option1',
    variant: 'primary',
    dataTestId: 'radio-basic',
  },
  render: ControlledTemplate,
};

export const Inline: Story = {
  args: {
    name: 'demo-radio-inline',
    legend: 'Inline options',
    items: sampleItems,
    selectedValue: 'option2',
    inline: true,
    variant: 'primary',
    dataTestId: 'radio-inline',
  },
  render: ControlledTemplate,
};

export const DisabledGroup: Story = {
  args: {
    name: 'demo-radio-disabled',
    legend: 'Disabled group',
    items: sampleItems,
    selectedValue: 'option1',
    disabled: true,
    variant: 'primary',
    dataTestId: 'radio-disabled-group',
  },
  render: ControlledTemplate,
};

export const WithDisabledOption: Story = {
  args: {
    name: 'demo-radio-option-disabled',
    legend: 'One option disabled',
    items: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2 (disabled)', value: 'option2', disabled: true },
      { label: 'Option 3', value: 'option3' },
    ],
    selectedValue: 'option3',
    dataTestId: 'radio-option-disabled',
  },
  render: ControlledTemplate,
};

export const Required: Story = {
  args: {
    name: 'demo-radio-required',
    legend: 'Required selection',
    items: sampleItems,
    required: true,
    dataTestId: 'radio-required',
  },
  render: ControlledTemplate,
};

export const WithoutLegendWithAria: Story = {
  args: {
    name: 'demo-radio-aria',
    ariaLabel: 'Options',
    legend: 'Options',
    items: sampleItems,
    selectedValue: 'option1',
    dataTestId: 'radio-aria',
  },
  render: ControlledTemplate,
};

export const Playground: Story = {
  args: {
    name: 'demo-radio-playground',
    legend: 'Playground',
    items: sampleItems,
    selectedValue: 'option1',
    inline: true,
    disabled: false,
    required: false,
    dataTestId: 'radio-playground',
    onChange: action('radio-changed'),
  },
  render: ControlledTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use controls to adjust props and observe behavior. onChange logs the selected value.',
      },
    },
  },
};


