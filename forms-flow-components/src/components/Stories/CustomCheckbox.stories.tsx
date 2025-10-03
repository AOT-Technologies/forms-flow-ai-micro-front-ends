import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomCheckbox } from '../CustomComponents/CustomCheckbox';

const meta: Meta<typeof CustomCheckbox> = {
  title: 'Components/CustomCheckbox',
  component: CustomCheckbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible checkbox group with fieldset/legend, i18n labels, inline layout, per-option/group disabled, and controlled multi-selection support.',
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
      description: 'Array of checkbox options { label, value, disabled?, onClick? }',
    },
    name: {
      control: 'text',
      description: 'Shared name for the checkbox group',
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
    selectedValues: {
      control: 'object',
      description: 'Currently selected values array (controlled)',
    },
    inline: {
      control: 'boolean',
      description: 'Display checkboxes inline (horizontal)',
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
      description: 'Called with (values, event) when selection changes',
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
  const [selectedValues, setSelectedValues] = React.useState(args.selectedValues || []);
  return (
    <div style={{ width: '400px', minHeight: '200px' }}>
      <CustomCheckbox
        {...args}
        selectedValues={selectedValues}
        onChange={(values: any[], event: React.ChangeEvent<HTMLInputElement>) => {
          setSelectedValues(values);
          // Forward to provided action handler if any
          if (typeof args.onChange === 'function') {
            args.onChange(values, event);
          } else {
            action('changed')(values, event);
          }
        }}
      />
      {selectedValues.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected:</strong> {selectedValues.join(', ')}
        </div>
      )}
    </div>
  );
};

export const Basic: Story = {
  args: {
    name: 'demo-checkbox',
    legend: 'Choose options',
    items: sampleItems,
    selectedValues: ['option1'],
    variant: 'primary',
    dataTestId: 'checkbox-basic',
  },
  render: ControlledTemplate,
};

export const MultipleSelection: Story = {
  args: {
    name: 'demo-checkbox-multiple',
    legend: 'Select multiple options',
    items: sampleItems,
    selectedValues: ['option1', 'option3'],
    variant: 'primary',
    dataTestId: 'checkbox-multiple',
  },
  render: ControlledTemplate,
};

export const Inline: Story = {
  args: {
    name: 'demo-checkbox-inline',
    legend: 'Inline options',
    items: sampleItems,
    selectedValues: ['option2'],
    inline: true,
    variant: 'primary',
    dataTestId: 'checkbox-inline',
  },
  render: ControlledTemplate,
};

export const DisabledGroup: Story = {
  args: {
    name: 'demo-checkbox-disabled',
    legend: 'Disabled group',
    items: sampleItems,
    selectedValues: ['option1'],
    disabled: true,
    variant: 'primary',
    dataTestId: 'checkbox-disabled-group',
  },
  render: ControlledTemplate,
};

export const WithDisabledOption: Story = {
  args: {
    name: 'demo-checkbox-option-disabled',
    legend: 'One option disabled',
    items: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2 (disabled)', value: 'option2', disabled: true },
      { label: 'Option 3', value: 'option3' },
    ],
    selectedValues: ['option1', 'option3'],
    dataTestId: 'checkbox-option-disabled',
  },
  render: ControlledTemplate,
};

export const Required: Story = {
  args: {
    name: 'demo-checkbox-required',
    legend: 'Required selection',
    items: sampleItems,
    required: true,
    dataTestId: 'checkbox-required',
  },
  render: ControlledTemplate,
};

export const WithoutLegendWithAria: Story = {
  args: {
    name: 'demo-checkbox-aria',
    ariaLabel: 'Options',
    legend: 'Options',
    items: sampleItems,
    selectedValues: ['option1'],
    dataTestId: 'checkbox-aria',
  },
  render: ControlledTemplate,
};

export const AllSelected: Story = {
  args: {
    name: 'demo-checkbox-all',
    legend: 'All options selected',
    items: sampleItems,
    selectedValues: ['option1', 'option2', 'option3'],
    variant: 'primary',
    dataTestId: 'checkbox-all',
  },
  render: ControlledTemplate,
};

export const NoneSelected: Story = {
  args: {
    name: 'demo-checkbox-none',
    legend: 'No options selected',
    items: sampleItems,
    selectedValues: [],
    variant: 'primary',
    dataTestId: 'checkbox-none',
  },
  render: ControlledTemplate,
};

export const SecondaryVariant: Story = {
  args: {
    name: 'demo-checkbox-secondary',
    legend: 'Secondary variant',
    items: sampleItems,
    selectedValues: ['option2'],
    variant: 'secondary',
    dataTestId: 'checkbox-secondary',
  },
  render: ControlledTemplate,
};

export const LongLabels: Story = {
  args: {
    name: 'demo-checkbox-long',
    legend: 'Long option labels',
    items: [
      { label: 'This is a very long option label that might wrap to multiple lines', value: 'long1' },
      { label: 'Another extremely long option with lots of descriptive text', value: 'long2' },
      { label: 'Short option', value: 'short' },
    ],
    selectedValues: ['long1'],
    inline: false,
    dataTestId: 'checkbox-long',
  },
  render: ControlledTemplate,
};

export const ManyOptions: Story = {
  args: {
    name: 'demo-checkbox-many',
    legend: 'Many options',
    items: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
      { label: 'Option 4', value: 'option4' },
      { label: 'Option 5', value: 'option5' },
      { label: 'Option 6', value: 'option6' },
      { label: 'Option 7', value: 'option7' },
      { label: 'Option 8', value: 'option8' },
    ],
    selectedValues: ['option1', 'option3', 'option5'],
    inline: false,
    dataTestId: 'checkbox-many',
  },
  render: ControlledTemplate,
};

export const Playground: Story = {
  args: {
    name: 'demo-checkbox-playground',
    legend: 'Playground',
    items: sampleItems,
    selectedValues: ['option1'],
    inline: true,
    disabled: false,
    required: false,
    variant: 'primary',
    dataTestId: 'checkbox-playground',
    onChange: action('checkbox-changed'),
  },
  render: ControlledTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use controls to adjust props and observe behavior. onChange logs the selected values array.',
      },
    },
  },
};
