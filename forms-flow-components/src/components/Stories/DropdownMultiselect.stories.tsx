import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DropdownMultiSelect } from '../CustomComponents/DropdownMultiselect';

const meta: Meta<typeof DropdownMultiSelect> = {
  title: 'Components/DropdownMultiselect',
  component: DropdownMultiSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A combined dropdown and multi-select component that allows single selection from a dropdown and optional multiple selections. Supports primary/secondary variants and provides flexible configuration options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    dropdownLabel: {
      control: 'text',
      description: 'Label text displayed above the component',
    },
    options: {
      control: 'object',
      description: 'Array of options for the dropdown',
    },
    multiSelectOptions: {
      control: 'object',
      description: 'Array of options for the multi-select',
    },
    value: {
      control: 'text',
      description: 'Currently selected value for the dropdown',
    },
    defaultValue: {
      control: 'text',
      description: 'Default value for the dropdown',
    },
    multiSelectedValues: {
      control: 'object',
      description: 'Array of currently selected values in multi-select',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the entire component',
    },
    enableMultiSelect: {
      control: 'boolean',
      description: 'Enables the multi-select functionality',
    },
    displayValue: {
      control: 'text',
      description: 'Property name to display from option objects',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the multi-select',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    id: {
      control: 'text',
      description: 'Unique identifier for the component',
    },
    onDropdownChange: {
      action: 'dropdown-changed',
      description: 'Callback when dropdown selection changes',
    },
    onMultiSelectionChange: {
      action: 'multi-selection-changed',
      description: 'Callback when multi-select values change',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Sample data for stories
// Dropdown options need 'label' and 'value' properties for SelectDropdown
const dropdownOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
  { label: 'Option 4', value: 'option4' },
];

// Multi-select options use 'name' property (based on displayValue prop)
const multiSelectOptions = [
  { id: 1, name: 'Item A' },
  { id: 2, name: 'Item B' },
  { id: 3, name: 'Item C' },
  { id: 4, name: 'Item D' },
  { id: 5, name: 'Item E' },
];

// Template for controlled component
const DropdownMultiselectTemplate = (args: any) => {
  const [dropdownValue, setDropdownValue] = useState(args.value || args.defaultValue);
  const [selectedItems, setSelectedItems] = useState(args.multiSelectedValues || []);

  const handleDropdownChange = (value: string | number) => {
    setDropdownValue(value);
    action('dropdown-changed')(value);
  };

  const handleMultiSelectionChange = (values: any[]) => {
    setSelectedItems(values);
    action('multi-selection-changed')(values);
  };

  return (
    <div style={{ width: '400px', minHeight: '300px' }}>
      <DropdownMultiSelect
        {...args}
        value={dropdownValue}
        multiSelectedValues={selectedItems}
        onDropdownChange={handleDropdownChange}
        onMultiSelectionChange={handleMultiSelectionChange}
      />
      {(dropdownValue || selectedItems.length > 0) && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          {dropdownValue && (
            <div>
              <strong>Dropdown Selection:</strong> {dropdownValue}
            </div>
          )}
          {selectedItems.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>Multi-Select Items:</strong> {selectedItems.map((item: any) => item.name).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Basic dropdown only
export const DropdownOnly: Story = {
  args: {
    dropdownLabel: 'Select an option',
    options: dropdownOptions,
    defaultValue: 'option1',
    enableMultiSelect: false,
    variant: 'primary',
    disabled: false,
    ariaLabel: 'dropdown-only',
    dataTestId: 'dropdown-only',
  },
  render: DropdownMultiselectTemplate,
};

// With multi-select enabled (Primary variant)
export const WithMultiSelect: Story = {
  args: {
    dropdownLabel: 'Select category and items',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option1',
    multiSelectedValues: [],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Select items...',
    ariaLabel: 'multi-select-primary',
    dataTestId: 'multi-select-primary',
  },
  render: DropdownMultiselectTemplate,
};

// Secondary variant with multi-select
export const SecondaryVariant: Story = {
  args: {
    dropdownLabel: 'Secondary Style',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option2',
    multiSelectedValues: [],
    enableMultiSelect: true,
    variant: 'secondary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Choose multiple...',
    ariaLabel: 'multi-select-secondary',
    dataTestId: 'multi-select-secondary',
  },
  render: DropdownMultiselectTemplate,
};

// With pre-selected items
export const WithPreselectedItems: Story = {
  args: {
    dropdownLabel: 'Pre-selected items',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option3',
    multiSelectedValues: [
      { id: 2, name: 'Item B' },
      { id: 4, name: 'Item D' },
    ],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Select items...',
    ariaLabel: 'preselected',
    dataTestId: 'preselected',
  },
  render: DropdownMultiselectTemplate,
};

// Disabled state
export const Disabled: Story = {
  args: {
    dropdownLabel: 'Disabled component',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option1',
    multiSelectedValues: [{ id: 1, name: 'Item A' }],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: true,
    displayValue: 'name',
    placeholder: 'Select items...',
    ariaLabel: 'disabled',
    dataTestId: 'disabled',
  },
  render: DropdownMultiselectTemplate,
};

// Disabled dropdown only
export const DisabledDropdownOnly: Story = {
  args: {
    dropdownLabel: 'Disabled dropdown',
    options: dropdownOptions,
    defaultValue: 'option2',
    enableMultiSelect: false,
    variant: 'primary',
    disabled: true,
    ariaLabel: 'disabled-dropdown',
    dataTestId: 'disabled-dropdown',
  },
  render: DropdownMultiselectTemplate,
};

// Without label
export const WithoutLabel: Story = {
  args: {
    dropdownLabel: '',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option1',
    multiSelectedValues: [],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Add items...',
    ariaLabel: 'no-label',
    dataTestId: 'no-label',
  },
  render: DropdownMultiselectTemplate,
};

// Many options
export const ManyOptions: Story = {
  args: {
    dropdownLabel: 'Select from many options',
    options: Array.from({ length: 10 }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: `option${i + 1}`,
    })),
    multiSelectOptions: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Item ${String.fromCharCode(65 + i)}`,
    })),
    defaultValue: 'option5',
    multiSelectedValues: [],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Choose multiple items...',
    ariaLabel: 'many-options',
    dataTestId: 'many-options',
  },
  render: DropdownMultiselectTemplate,
};

// Custom class name
export const WithCustomClass: Story = {
  args: {
    dropdownLabel: 'Custom styled',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option1',
    multiSelectedValues: [],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Select items...',
    className: 'custom-dropdown-class',
    multiSelectPillClassName: 'custom-pill',
    ariaLabel: 'custom-class',
    dataTestId: 'custom-class',
  },
  render: DropdownMultiselectTemplate,
};

// Interactive playground
export const Playground: Story = {
  args: {
    dropdownLabel: 'Interactive Dropdown Multiselect',
    options: dropdownOptions,
    multiSelectOptions: multiSelectOptions,
    defaultValue: 'option1',
    multiSelectedValues: [],
    enableMultiSelect: true,
    variant: 'primary',
    disabled: false,
    displayValue: 'name',
    placeholder: 'Select items...',
    ariaLabel: 'playground',
    dataTestId: 'playground',
    className: '',
    id: 'playground-dropdown',
  },
  render: DropdownMultiselectTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all component properties and see how they affect the behavior and appearance.',
      },
    },
  },
};

