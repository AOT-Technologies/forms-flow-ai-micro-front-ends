import type { Meta, StoryObj } from '@storybook/react';
import { CustomProgressBar } from '../CustomComponents/ProgressBar';

const meta: Meta<typeof CustomProgressBar> = {
  title: 'Components/CustomProgressBar',
  component: CustomProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable progress bar component with color variants and dynamic styling. Supports different color states for various use cases like uploads, downloads, and form completion.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0-100)',
    },
    color: {
      control: 'select',
      options: ['passive', 'error', 'warning', 'default'],
      description: 'Color variant for the progress bar',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Basic progress states
export const Default: Story = {
  args: {
    progress: 50,
  },
};

export const Empty: Story = {
  args: {
    progress: 0,
  },
};

export const Complete: Story = {
  args: {
    progress: 100,
  },
};

// Color variants
export const Passive: Story = {
  args: {
    progress: 30,
    color: 'passive',
  },
};

export const Error: Story = {
  args: {
    progress: 45,
    color: 'error',
  },
};

export const Warning: Story = {
  args: {
    progress: 75,
    color: 'warning',
  },
};

// Use case examples
export const UploadProgress: Story = {
  args: {
    progress: 65,
    color: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical upload progress with default primary color.',
      },
    },
  },
};

export const UploadError: Story = {
  args: {
    progress: 30,
    color: 'error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Upload failed at 30% - shows error state.',
      },
    },
  },
};

export const FormCompletion: Story = {
  args: {
    progress: 80,
    color: 'passive',
  },
  parameters: {
    docs: {
      description: {
        story: 'Form completion progress with passive color.',
      },
    },
  },
};

export const SystemWarning: Story = {
  args: {
    progress: 90,
    color: 'warning',
  },
  parameters: {
    docs: {
      description: {
        story: 'System process with warning state.',
      },
    },
  },
};

// Interactive playground
export const Playground: Story = {
  args: {
    progress: 50,
    color: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use controls to adjust progress and color. Note that at 50% progress, the bar will always show orange regardless of the color setting.',
      },
    },
  },
};