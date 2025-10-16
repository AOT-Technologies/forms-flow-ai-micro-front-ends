import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { UserSelect, UserOption } from '../CustomComponents/UserSelect';

// Sample user data for stories
const sampleUsers: UserOption[] = [
  { id: '1', username: 'jdoe', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' },
  { id: '2', username: 'asmith', firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@example.com' },
  { id: '3', username: 'bwilliams', firstName: 'Bob', lastName: 'Williams', email: 'bob.williams@example.com' },
  { id: '4', username: 'cjohnson', firstName: 'Carol', lastName: 'Johnson', email: 'carol.johnson@example.com' },
  { id: '5', username: 'dlee', firstName: 'David', lastName: 'Lee', email: 'david.lee@example.com' },
];

const manyUsers: UserOption[] = [
  ...sampleUsers,
  { id: '6', username: 'ebrown', firstName: 'Emily', lastName: 'Brown', email: 'emily.brown@example.com' },
  { id: '7', username: 'fgarcia', firstName: 'Frank', lastName: 'Garcia', email: 'frank.garcia@example.com' },
  { id: '8', username: 'gmartinez', firstName: 'Grace', lastName: 'Martinez', email: 'grace.martinez@example.com' },
  { id: '9', username: 'hrodriguez', firstName: 'Henry', lastName: 'Rodriguez', email: 'henry.rodriguez@example.com' },
  { id: '10', username: 'iwilson', firstName: 'Iris', lastName: 'Wilson', email: 'iris.wilson@example.com' },
  { id: '11', username: 'janderson', firstName: 'Jack', lastName: 'Anderson', email: 'jack.anderson@example.com' },
  { id: '12', username: 'kthomas', firstName: 'Karen', lastName: 'Thomas', email: 'karen.thomas@example.com' },
  { id: '13', username: 'ltaylor', firstName: 'Leo', lastName: 'Taylor', email: 'leo.taylor@example.com' },
  { id: '14', username: 'mmoore', firstName: 'Maria', lastName: 'Moore', email: 'maria.moore@example.com' },
  { id: '15', username: 'nmartin', firstName: 'Nancy', lastName: 'Martin', email: 'nancy.martin@example.com' },
];

const usersWithoutNames: UserOption[] = [
  { id: '1', username: 'user123', email: 'user123@example.com' },
  { id: '2', username: 'admin456', email: 'admin456@example.com' },
  { id: '3', username: 'developer789', email: 'developer789@example.com' },
];

const usersWithPartialNames: UserOption[] = [
  { id: '1', username: 'jdoe', firstName: 'John', email: 'john@example.com' },
  { id: '2', username: 'smithy', lastName: 'Smith', email: 'smith@example.com' },
  { id: '3', username: 'bobw', email: 'bob@example.com' },
];

// Template for controlled UserSelect
const UserSelectTemplate = (args: any) => {
  const [selectedValue, setSelectedValue] = useState(args.value || '');

  const handleChange = (value: string | number) => {
    setSelectedValue(value as string);
    action('user-changed')(value);
  };

  return (
    <div style={{ minHeight: '300px', padding: '20px' }}>
      <UserSelect
        {...args}
        value={selectedValue}
        onChange={handleChange}
      />
    </div>
  );
};

const meta: Meta<typeof UserSelect> = {
  title: 'Components/UserSelect',
  component: UserSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A specialized dropdown component for selecting users from a list. Built on SelectDropdown with user-specific features like name formatting, email display, and smart sorting. Includes "Assign to me" and "Unassigned" special options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    users: {
      control: 'object',
      description: 'Array of user objects to display in the dropdown',
    },
    value: {
      control: 'text',
      description: 'Currently selected user username',
    },
    onChange: {
      action: 'user-changed',
      description: 'Callback function when user selection changes',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the user select dropdown',
    },
    includeEmailInLabel: {
      control: 'boolean',
      description: 'Shows email address alongside user name in dropdown',
    },
    showAsText: {
      control: 'boolean',
      description: 'Display as text that converts to dropdown on hover/focus',
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
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-basic',
  },
};

export const WithPreselectedUser: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: 'jdoe',
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-preselected',
  },
  parameters: {
    docs: {
      description: {
        story: 'User select with a pre-selected user value.',
      },
    },
  },
};

export const WithEmailLabels: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    disabled: false,
    includeEmailInLabel: true,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-with-email',
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays email addresses alongside user names in the dropdown for easier identification.',
      },
    },
  },
};

export const ShowAsText: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: 'asmith',
    disabled: false,
    includeEmailInLabel: false,
    showAsText: true,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-as-text',
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays as plain text that converts to a dropdown when hovered, focused, or clicked. Useful for inline editing scenarios.',
      },
    },
  },
};

export const Disabled: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: 'jdoe',
    disabled: true,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-disabled',
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state prevents user interaction.',
      },
    },
  },
};

export const ManyUsers: Story = {
  render: UserSelectTemplate,
  args: {
    users: manyUsers,
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-many',
  },
  parameters: {
    docs: {
      description: {
        story: 'User select with a large list of users. Users are automatically sorted alphabetically by name.',
      },
    },
  },
};

export const ManyUsersWithEmail: Story = {
  render: UserSelectTemplate,
  args: {
    users: manyUsers,
    disabled: false,
    includeEmailInLabel: true,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-many-email',
  },
  parameters: {
    docs: {
      description: {
        story: 'Large user list with email addresses displayed. Searchable dropdown helps find users quickly.',
      },
    },
  },
};

export const UsersWithoutNames: Story = {
  render: UserSelectTemplate,
  args: {
    users: usersWithoutNames,
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-no-names',
  },
  parameters: {
    docs: {
      description: {
        story: 'Handles users who only have usernames (no first/last name). Falls back to displaying username.',
      },
    },
  },
};

export const UsersWithPartialNames: Story = {
  render: UserSelectTemplate,
  args: {
    users: usersWithPartialNames,
    disabled: false,
    includeEmailInLabel: true,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-partial-names',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates smart name formatting for users with only first name, only last name, or neither.',
      },
    },
  },
};

export const EmptyUserList: Story = {
  render: UserSelectTemplate,
  args: {
    users: [],
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-empty',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows only the special options ("Assign to me" and "Unassigned") when no users are provided.',
      },
    },
  },
};

export const AssignToMe: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: 'me',
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-assign-me',
  },
  parameters: {
    docs: {
      description: {
        story: 'Pre-selected with the special "Assign to me" option.',
      },
    },
  },
};

export const Unassigned: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: 'unassigned',
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-unassigned',
  },
  parameters: {
    docs: {
      description: {
        story: 'Pre-selected with the special "Unassigned" option.',
      },
    },
  },
};

export const ShowAsTextWithHover: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: 'cjohnson',
    disabled: false,
    includeEmailInLabel: false,
    showAsText: true,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-text-hover',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline text mode - hover over the name to activate the dropdown for editing.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  render: UserSelectTemplate,
  args: {
    users: sampleUsers,
    value: '',
    disabled: false,
    includeEmailInLabel: false,
    showAsText: false,
    ariaLabel: 'Select user',
    dataTestId: 'user-select-playground',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all UserSelect properties and see how they affect the component.',
      },
    },
  },
};

