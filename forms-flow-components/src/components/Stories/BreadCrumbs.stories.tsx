import type { Meta, StoryObj } from '@storybook/react';
import { BreadCrumbs, BreadcrumbItem, BreadcrumbVariant } from '../CustomComponents/BreadCrumbs';

const meta: Meta<typeof BreadCrumbs> = {
  title: 'Components/BreadCrumbs',
  component: BreadCrumbs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible breadcrumb navigation component with multiple variants and styling options. Built with React Bootstrap for consistent styling and accessibility.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of breadcrumb items with label and optional path',
    },
    variant: {
      control: 'select',
      options: [BreadcrumbVariant.DEFAULT, BreadcrumbVariant.MINIMIZED],
      description: 'Breadcrumb visual style variant',
    },
    underline: {
      control: 'boolean',
      description: 'Show underline below breadcrumb items',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Sample breadcrumb data for stories
const sampleItems: BreadcrumbItem[] = [
  { label: 'Home', path: '/home' },
  { label: 'Applications', path: '/applications' },
  { label: 'Form Details', path: '/applications/form-details' },
  { label: 'Current Step' },
];

const longItems: BreadcrumbItem[] = [
  { label: 'Home', path: '/home' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Projects', path: '/projects' },
  { label: 'Project Alpha', path: '/projects/alpha' },
  { label: 'Submissions', path: '/projects/alpha/submissions' },
  { label: 'Form 12345', path: '/projects/alpha/submissions/12345' },
  { label: 'Review Step' },
];

export const Basic: Story = {
  args: {
    items: sampleItems,
    variant: BreadcrumbVariant.DEFAULT,
    underline: false,
  },
};

export const Minimized: Story = {
  args: {
    items: sampleItems,
    variant: BreadcrumbVariant.MINIMIZED,
    underline: false,
  },
};

export const WithUnderline: Story = {
  args: {
    items: sampleItems,
    variant: BreadcrumbVariant.DEFAULT,
    underline: true,
  },
};

export const MinimizedWithUnderline: Story = {
  args: {
    items: sampleItems,
    variant: BreadcrumbVariant.MINIMIZED,
    underline: true,
  },
};

export const LongBreadcrumb: Story = {
  args: {
    items: longItems,
    variant: BreadcrumbVariant.DEFAULT,
    underline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of a long breadcrumb trail showing how the component handles multiple navigation levels.',
      },
    },
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ label: 'Home' }],
    variant: BreadcrumbVariant.DEFAULT,
    underline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb with a single item, demonstrating how the component handles minimal navigation.',
      },
    },
  },
};

export const NoPaths: Story = {
  args: {
    items: [
      { label: 'Section 1' },
      { label: 'Section 2' },
      { label: 'Current Section' },
    ],
    variant: BreadcrumbVariant.DEFAULT,
    underline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Breadcrumb items without paths, showing how non-clickable items are rendered.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  args: {
    items: sampleItems,
    variant: BreadcrumbVariant.DEFAULT,
    underline: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all breadcrumb properties and see how they affect the component.',
      },
    },
  },
};
