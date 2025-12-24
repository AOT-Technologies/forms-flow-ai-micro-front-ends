import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MultipleSelect } from '../CustomComponents/MultiSelect';

const meta: Meta<typeof MultipleSelect> = {
  title: 'Components/MultiSelect',
  component: MultipleSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A multi-select dropdown component that allows users to select multiple options from a list. Features custom close icons, primary/secondary variants, and supports disabled states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of options to display in the dropdown',
    },
    selectedValues: {
      control: 'object',
      description: 'Array of currently selected values',
    },
    displayValue: {
      control: 'text',
      description: 'Property name to display from option objects',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no options selected',
    },
    label: {
      control: 'text',
      description: 'Label text displayed above the component',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the component',
    },
    avoidHighlightFirstOption: {
      control: 'boolean',
      description: 'Prevents highlighting the first option by default',
    },
    hidePlaceholder: {
      control: 'boolean',
      description: 'Hides the placeholder text',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    onSelect: {
      action: 'selected',
      description: 'Callback when an option is selected',
    },
    onRemove: {
      action: 'removed',
      description: 'Callback when an option is removed',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Sample data for stories
const fruitOptions = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
  { id: 4, name: 'Date' },
  { id: 5, name: 'Elderberry' },
  { id: 6, name: 'Fig' },
  { id: 7, name: 'Grape' },
];

const colorOptions = [
  { id: 1, name: 'Red', hex: '#FF0000' },
  { id: 2, name: 'Green', hex: '#00FF00' },
  { id: 3, name: 'Blue', hex: '#0000FF' },
  { id: 4, name: 'Yellow', hex: '#FFFF00' },
  { id: 5, name: 'Purple', hex: '#800080' },
  { id: 6, name: 'Orange', hex: '#FFA500' },
];

const countryOptions = [
  { id: 1, name: 'United States', code: 'US' },
  { id: 2, name: 'Canada', code: 'CA' },
  { id: 3, name: 'United Kingdom', code: 'UK' },
  { id: 4, name: 'Germany', code: 'DE' },
  { id: 5, name: 'France', code: 'FR' },
  { id: 6, name: 'Japan', code: 'JP' },
  { id: 7, name: 'Australia', code: 'AU' },
  { id: 8, name: 'Brazil', code: 'BR' },
  { id: 9, name: 'India', code: 'IN' },
  { id: 10, name: 'China', code: 'CN' },
];

// Template for controlled component
const MultiSelectTemplate = (args: any) => {
  const [selectedItems, setSelectedItems] = useState(args.selectedValues || []);

  const handleSelect = (selectedList: any[]) => {
    setSelectedItems(selectedList);
    action('selected')(selectedList);
  };

  const handleRemove = (selectedList: any[]) => {
    setSelectedItems(selectedList);
    action('removed')(selectedList);
  };

  return (
    <div style={{ width: '400px', minHeight: '300px' }}>
      <MultipleSelect
        {...args}
        selectedValues={selectedItems}
        onSelect={handleSelect}
        onRemove={handleRemove}
      />
      {selectedItems.length > 0 && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected Items ({selectedItems.length}):</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            {selectedItems.map((item: any) => (
              <li key={item.id}>{item[args.displayValue || 'name']}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Primary variant (default)
export const Primary: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select fruits...',
    label: 'Choose your favorite fruits',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Secondary variant
export const Secondary: Story = {
  args: {
    options: colorOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select colors...',
    label: 'Choose colors',
    variant: 'secondary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// With pre-selected values
export const WithPreselectedValues: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [
      { id: 2, name: 'Banana' },
      { id: 5, name: 'Elderberry' },
    ],
    displayValue: 'name',
    placeholder: 'Select fruits...',
    label: 'Pre-selected fruits',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Without label
export const WithoutLabel: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select items...',
    label: '',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Disabled state (Primary)
export const DisabledPrimary: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [
      { id: 1, name: 'Apple' },
      { id: 3, name: 'Cherry' },
    ],
    displayValue: 'name',
    placeholder: 'Select fruits...',
    label: 'Disabled multi-select',
    variant: 'primary',
    disabled: true,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Disabled state (Secondary)
export const DisabledSecondary: Story = {
  args: {
    options: colorOptions,
    selectedValues: [
      { id: 1, name: 'Red', hex: '#FF0000' },
      { id: 3, name: 'Blue', hex: '#0000FF' },
    ],
    displayValue: 'name',
    placeholder: 'Select colors...',
    label: 'Disabled secondary variant',
    variant: 'secondary',
    disabled: true,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Many options
export const ManyOptions: Story = {
  args: {
    options: countryOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select countries...',
    label: 'Select countries',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// With all items selected
export const AllSelected: Story = {
  args: {
    options: fruitOptions,
    selectedValues: fruitOptions,
    displayValue: 'name',
    placeholder: 'Select fruits...',
    label: 'All fruits selected',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Custom placeholder hidden
export const HiddenPlaceholder: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'This placeholder is hidden',
    label: 'Hidden placeholder example',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: true,
  },
  render: MultiSelectTemplate,
};

// Large dataset
export const LargeDataset: Story = {
  args: {
    options: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      category: `Category ${Math.floor(i / 10) + 1}`,
    })),
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select from 50 items...',
    label: 'Large dataset (50 items)',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Tests performance with a large number of options.',
      },
    },
  },
};

// Custom class name
export const WithCustomClass: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select fruits...',
    label: 'Custom styled',
    variant: 'primary',
    disabled: false,
    className: 'custom-multiselect-class',
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
};

// Highlight first option
export const HighlightFirstOption: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'First option highlighted...',
    label: 'First option auto-highlighted',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: false,
    hidePlaceholder: false,
  },
  render: MultiSelectTemplate,
  parameters: {
    docs: {
      description: {
        story: 'First option is highlighted by default when dropdown opens.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    options: fruitOptions,
    selectedValues: [],
    displayValue: 'name',
    placeholder: 'Select items...',
    label: 'Interactive Multi-Select',
    variant: 'primary',
    disabled: false,
    avoidHighlightFirstOption: true,
    hidePlaceholder: false,
    className: '',
  },
  render: MultiSelectTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all component properties and see how they affect the behavior and appearance.',
      },
    },
  },
};

