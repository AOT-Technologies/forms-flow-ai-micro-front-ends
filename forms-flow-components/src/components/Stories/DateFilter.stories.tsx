import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DateRangePicker } from '../CustomComponents/DateFilter';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A comprehensive date range picker component with calendar interface, keyboard navigation, and accessibility features. Supports date range selection, single date selection, and various date formats.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onChange: {
      action: 'date-range-changed',
      description: 'Called when date range changes',
    },
    value: {
      control: 'object',
      description: 'Initial date range to display',
    },
    dateFormat: {
      control: 'text',
      description: 'Format for displaying dates (default: MM/DD/YYYY)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no dates are selected',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled date range picker
const DateRangePickerTemplate = (args: any) => {
  const [dateRange, setDateRange] = useState(args.value || null);

  const handleDateRangeChange = (newDateRange: any) => {
    setDateRange(newDateRange);
    action('date-range-changed')(newDateRange);
  };

  return (
    <div style={{ width: '400px', minHeight: '400px' }}>
      <DateRangePicker
        {...args}
        value={dateRange}
        onChange={handleDateRangeChange}
      />
    </div>
  );
};

// Basic date range picker
export const Default: Story = {
  args: {
    placeholder: 'Select date range',
    dateFormat: 'MM/DD/YYYY',
  },
  render: DateRangePickerTemplate,
};

// With initial date range
export const WithInitialRange: Story = {
  args: {
    value: {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
    },
    placeholder: 'Select date range',
    dateFormat: 'MM/DD/YYYY',
  },
  render: DateRangePickerTemplate,
};

// Single date selection
export const SingleDate: Story = {
  args: {
    value: {
      startDate: new Date('2024-03-15'),
      endDate: null,
    },
    placeholder: 'Select date',
    dateFormat: 'MM/DD/YYYY',
  },
  render: DateRangePickerTemplate,
};


// Interactive playground
export const Playground: Story = {
  args: {
    placeholder: 'Select date range',
    dateFormat: 'MM/DD/YYYY',
  },
  render: DateRangePickerTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls to adjust props and observe behavior. Try different date formats, placeholders, and initial values.',
      },
    },
  },
};

