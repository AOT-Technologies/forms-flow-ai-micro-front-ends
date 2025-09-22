import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { V8CustomButton } from '../CustomComponents/CustomButton';

const meta: Meta<typeof V8CustomButton> = {
  title: 'Components/CustomButton',
  component: V8CustomButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary'] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    onClick: { action: 'clicked' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    onClick: action('primary-clicked'),
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    onClick: action('secondary-clicked'),
  },
};

export const Loading: Story = {
  args: {
    label: 'Loading Button',
    loading: true,
    onClick: action('loading-button-clicked'),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    disabled: true,
    onClick: action('disabled-button-clicked'),
  },
};

export const IconOnly: Story = {
  args: {
    icon: <span>⚙️</span>,
    iconOnly: true,
    ariaLabel: 'Settings',
    onClick: action('icon-only-clicked'),
  },
};

export const Small: Story = {
  args: {
    label: 'Small Button',
    size: 'small',
    onClick: action('small-button-clicked'),
  },
};

export const Large: Story = {
  args: {
    label: 'Large Button',
    size: 'large',
    onClick: action('large-button-clicked'),
  },
};
