import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { V8CustomDropdownButton } from '../CustomComponents/CustomDropdownButton';

const meta: Meta<typeof V8CustomDropdownButton> = {
  title: 'Components/CustomDropdownButton',
  component: V8CustomDropdownButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable dropdown button component with accessibility features, menu positioning, and flexible item configuration. Supports primary/secondary variants and disabled states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Button label text',
    },
    dropdownItems: {
      control: 'object',
      description: 'Array of dropdown menu items',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Button visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the dropdown button',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
    menuPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Dropdown menu alignment',
    },
    onLabelClick: {
      action: 'label-clicked',
      description: 'Called when the label is clicked',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled dropdown button component
const CustomDropdownButtonTemplate = (args: any) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemClick = (item: any) => {
    setSelectedItem(item.label);
    action('item-clicked')(item);
  };

  const handleLabelClick = () => {
    setSelectedItem(args.label);
    action('label-clicked')(args.label);
  };

  // Create dropdown items with click handlers
  const dropdownItems = args.dropdownItems.map((item: any) => ({
    ...item,
    onClick: () => handleItemClick(item),
  }));

  return (
    <div style={{ width: '300px', minHeight: '200px' }}>
      <V8CustomDropdownButton
        {...args}
        dropdownItems={dropdownItems}
        onLabelClick={handleLabelClick}
      />
      {selectedItem && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected:</strong> {selectedItem}
        </div>
      )}
    </div>
  );
};

// Basic dropdown button
export const Default: Story = {
  args: {
    label: 'Actions',
    dropdownItems: [
      { label: 'Edit', value: 'edit', dataTestId: 'edit-item' },
      { label: 'Delete', value: 'delete', dataTestId: 'delete-item' },
      { label: 'Duplicate', value: 'duplicate', dataTestId: 'duplicate-item' },
    ],
    variant: 'primary',
    disabled: false,
    dataTestId: 'dropdown-default',
  },
  render: CustomDropdownButtonTemplate,
};

// Secondary variant
export const Secondary: Story = {
  args: {
    label: 'Options',
    dropdownItems: [
      { label: 'View Details', value: 'view', dataTestId: 'view-item' },
      { label: 'Export', value: 'export', dataTestId: 'export-item' },
      { label: 'Share', value: 'share', dataTestId: 'share-item' },
    ],
    variant: 'secondary',
    disabled: false,
    dataTestId: 'dropdown-secondary',
  },
  render: CustomDropdownButtonTemplate,
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Disabled Actions',
    dropdownItems: [
      { label: 'Edit', value: 'edit' },
      { label: 'Delete', value: 'delete' },
      { label: 'Duplicate', value: 'duplicate' },
    ],
    variant: 'primary',
    disabled: true,
    dataTestId: 'dropdown-disabled',
  },
  render: CustomDropdownButtonTemplate,
};

// Right-aligned menu
export const RightAligned: Story = {
  args: {
    label: 'Menu Right',
    dropdownItems: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
    variant: 'primary',
    disabled: false,
    menuPosition: 'right',
    dataTestId: 'dropdown-right',
  },
  render: CustomDropdownButtonTemplate,
};

// Many items
export const ManyItems: Story = {
  args: {
    label: 'Many Options',
    dropdownItems: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
      { label: 'Option 4', value: 'option4' },
      { label: 'Option 5', value: 'option5' },
      { label: 'Option 6', value: 'option6' },
      { label: 'Option 7', value: 'option7' },
      { label: 'Option 8', value: 'option8' },
    ],
    variant: 'primary',
    disabled: false,
    dataTestId: 'dropdown-many',
  },
  render: CustomDropdownButtonTemplate,
};

// Long labels
export const LongLabels: Story = {
  args: {
    label: 'Long Action Button',
    dropdownItems: [
      { label: 'This is a very long menu item label that might wrap', value: 'long1' },
      { label: 'Another extremely long menu item with lots of text', value: 'long2' },
      { label: 'Short', value: 'short' },
    ],
    variant: 'primary',
    disabled: false,
    dataTestId: 'dropdown-long',
  },
  render: CustomDropdownButtonTemplate,
};
