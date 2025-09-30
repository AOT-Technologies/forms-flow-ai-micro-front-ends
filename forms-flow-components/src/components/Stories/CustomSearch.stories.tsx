import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomSearch } from '../CustomComponents/Search';

const meta: Meta<typeof CustomSearch> = {
  title: 'Components/CustomSearch',
  component: CustomSearch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A simple search input component with keyboard navigation, accessibility features, and customizable placeholder text. Supports Enter key search and disabled state.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    search: {
      control: 'text',
      description: 'Current search value',
    },
    setSearch: {
      action: 'search-changed',
      description: 'Called when search value changes',
    },
    handleSearch: {
      action: 'search-submitted',
      description: 'Called when search is submitted (Enter key)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the search input',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template for controlled search component
const CustomSearchTemplate = (args: any) => {
  const [search, setSearch] = useState(args.search || '');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    action('search-changed')(value);
  };

  const handleSearchSubmit = () => {
    action('search-submitted')(search);
  };

  return (
    <div style={{ width: '500px' }}>
      <CustomSearch
        {...args}
        search={search}
        setSearch={handleSearchChange}
        handleSearch={handleSearchSubmit}
      />
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <div><strong>Current search:</strong> "{search}"</div>
        <div><strong>Tip:</strong> Press Enter to submit search</div>
      </div>
    </div>
  );
};

// Basic search component
export const Default: Story = {
  args: {
    placeholder: 'Search',
    dataTestId: 'search-input',
    disabled: false,
  },
  render: CustomSearchTemplate,
};

// With initial search value
export const WithInitialValue: Story = {
  args: {
    search: 'initial search',
    placeholder: 'Search',
    dataTestId: 'search-input',
    disabled: false,
  },
  render: CustomSearchTemplate,
};

// Disabled state
export const Disabled: Story = {
  args: {
    placeholder: 'Search is disabled',
    dataTestId: 'search-input-disabled',
    disabled: true,
  },
  render: CustomSearchTemplate,
};

// Custom placeholder
export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Search for users, documents, or anything...',
    dataTestId: 'search-input-custom',
    disabled: false,
  },
  render: CustomSearchTemplate,
};

// Long placeholder text
export const LongPlaceholder: Story = {
  args: {
    placeholder: 'Enter your search query to find relevant information across all available resources',
    dataTestId: 'search-input-long',
    disabled: false,
  },
  render: CustomSearchTemplate,
};

// Demonstrates Enter key functionality
export const EnterKeySearch: Story = {
  args: {
    placeholder: 'Type and press Enter to search',
    dataTestId: 'search-input-enter',
    disabled: false,
  },
  render: CustomSearchTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Type in the search box and press Enter to trigger the search. The search will be logged to the Actions panel.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    placeholder: 'Search',
    dataTestId: 'search-input-playground',
    disabled: false,
  },
  render: CustomSearchTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use the controls to adjust props and observe behavior. Try different placeholder texts, disabled states, and search values. Press Enter to submit searches.',
      },
    },
  },
};
