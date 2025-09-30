import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { SelectDropdown } from '../CustomComponents/SelectDropdown';

const meta: Meta<typeof SelectDropdown> = {
  title: 'Components/SelectDropdown',
  component: SelectDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An accessible, optimized dropdown component with search functionality. Supports both traditional dropdown and searchable input modes with keyboard navigation, accessibility features, and performance optimizations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of dropdown options',
    },
    value: {
      control: 'text',
      description: 'Currently selected value',
    },
    onChange: {
      action: 'selection-changed',
      description: 'Called when selection changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the dropdown',
    },
    defaultValue: {
      control: 'text',
      description: 'Default value when nothing is selected',
    },
    searchDropdown: {
      control: 'boolean',
      description: 'Enables searchable input mode',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled SelectDropdown component
const SelectDropdownTemplate = (args: any) => {
  const [selectedValue, setSelectedValue] = useState(args.value || args.defaultValue);

  const handleChange = (value: string | number) => {
    setSelectedValue(value);
    action('selection-changed')(value);
  };

  return (
    <div style={{ width: '300px', minHeight: '200px' }}>
      <SelectDropdown
        {...args}
        value={selectedValue}
        onChange={handleChange}
      />
      {selectedValue && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected:</strong> {selectedValue}
        </div>
      )}
    </div>
  );
};

// Basic dropdown
export const Default: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'Select an option',
    disabled: false,
    searchDropdown: false,
    dataTestId: 'select-default',
    ariaLabel: 'Choose an option',
  },
  render: SelectDropdownTemplate,
};

// Search dropdown
export const Searchable: Story = {
  args: {
    options: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
      { label: 'Date', value: 'date' },
      { label: 'Elderberry', value: 'elderberry' },
      { label: 'Fig', value: 'fig' },
      { label: 'Grape', value: 'grape' },
    ],
    defaultValue: 'Search fruits...',
    disabled: false,
    searchDropdown: true,
    dataTestId: 'select-search',
    ariaLabel: 'Search for a fruit',
  },
  render: SelectDropdownTemplate,
};

// With initial value
export const WithInitialValue: Story = {
  args: {
    options: [
      { label: 'Red', value: 'red' },
      { label: 'Green', value: 'green' },
      { label: 'Blue', value: 'blue' },
      { label: 'Yellow', value: 'yellow' },
    ],
    value: 'green',
    disabled: false,
    searchDropdown: false,
    dataTestId: 'select-initial',
    ariaLabel: 'Choose a color',
  },
  render: SelectDropdownTemplate,
};

// Disabled state
export const Disabled: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'Disabled dropdown',
    disabled: true,
    searchDropdown: false,
    dataTestId: 'select-disabled',
    ariaLabel: 'Disabled dropdown',
  },
  render: SelectDropdownTemplate,
};

// Many options
export const ManyOptions: Story = {
  args: {
    options: [
      { label: 'Alabama', value: 'al' },
      { label: 'Alaska', value: 'ak' },
      { label: 'Arizona', value: 'az' },
      { label: 'Arkansas', value: 'ar' },
      { label: 'California', value: 'ca' },
      { label: 'Colorado', value: 'co' },
      { label: 'Connecticut', value: 'ct' },
      { label: 'Delaware', value: 'de' },
      { label: 'Florida', value: 'fl' },
      { label: 'Georgia', value: 'ga' },
      { label: 'Hawaii', value: 'hi' },
      { label: 'Idaho', value: 'id' },
      { label: 'Illinois', value: 'il' },
      { label: 'Indiana', value: 'in' },
      { label: 'Iowa', value: 'ia' },
    ],
    defaultValue: 'Select a state',
    disabled: false,
    searchDropdown: true,
    dataTestId: 'select-states',
    ariaLabel: 'Choose a state',
  },
  render: SelectDropdownTemplate,
};

// Long option labels
export const LongLabels: Story = {
  args: {
    options: [
      { label: 'This is a very long option label that might wrap to multiple lines', value: 'long1' },
      { label: 'Another extremely long option with lots of descriptive text', value: 'long2' },
      { label: 'Short option', value: 'short' },
      { label: 'Medium length option with some description', value: 'medium' },
    ],
    defaultValue: 'Select an option',
    disabled: false,
    searchDropdown: false,
    dataTestId: 'select-long',
    ariaLabel: 'Choose an option',
  },
  render: SelectDropdownTemplate,
};

// Search with no results
export const SearchNoResults: Story = {
  args: {
    options: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ],
    defaultValue: 'Search fruits...',
    disabled: false,
    searchDropdown: true,
    dataTestId: 'select-no-results',
    ariaLabel: 'Search for a fruit',
  },
  render: SelectDropdownTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Try searching for "orange" to see the "No Matching Results" state.',
      },
    },
  },
};

// Numeric values
export const NumericValues: Story = {
  args: {
    options: [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
      { label: 'Three', value: 3 },
      { label: 'Four', value: 4 },
      { label: 'Five', value: 5 },
    ],
    defaultValue: 'Select a number',
    disabled: false,
    searchDropdown: false,
    dataTestId: 'select-numeric',
    ariaLabel: 'Choose a number',
  },
  render: SelectDropdownTemplate,
};

// Mixed string and numeric values
export const MixedValues: Story = {
  args: {
    options: [
      { label: 'String Option', value: 'string' },
      { label: 'Numeric Option', value: 42 },
      { label: 'Another String', value: 'another' },
      { label: 'Another Number', value: 100 },
    ],
    defaultValue: 'Select mixed type',
    disabled: false,
    searchDropdown: false,
    dataTestId: 'select-mixed',
    ariaLabel: 'Choose an option',
  },
  render: SelectDropdownTemplate,
};

// Interactive playground
export const Playground: Story = {
  args: {
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    defaultValue: 'Select an option',
    disabled: false,
    searchDropdown: false,
    dataTestId: 'select-playground',
    ariaLabel: 'Choose an option',
  },
  render: SelectDropdownTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all dropdown properties and see how they affect the component.',
      },
    },
  },
};
