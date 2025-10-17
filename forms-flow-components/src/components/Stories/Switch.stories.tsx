import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Switch } from '../CustomComponents/Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile switch component with multiple variants, states, and accessibility features. Built with TypeScript and React for optimal performance and user experience.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the switch is checked/on'
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the switch'
    },
    withIcon: {
      control: 'boolean',
      description: 'Shows icon inside the switch'
    },
    type: {
      control: 'select',
      options: ['default', 'primary', 'binary'],
      description: 'Switch visual style variant'
    },
    label: {
      control: 'text',
      description: 'Label text for the switch'
    },
    id: {
      control: 'text',
      description: 'HTML id attribute for the switch'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    onChange: {
      action: 'changed',
      description: 'Callback when switch state changes'
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
    disabled: false,
    withIcon: false,
    type: 'default',
    label: 'Default Switch',
    onChange: action('default-changed'),
  },
};

export const Checked: Story = {
  args: {
    checked: true,
    disabled: false,
    withIcon: false,
    type: 'default',
    label: 'Checked Switch',
    onChange: action('checked-changed'),
  },
};

export const Primary: Story = {
  args: {
    checked: true,
    disabled: false,
    withIcon: false,
    type: 'primary',
    label: 'Primary Switch',
    onChange: action('primary-changed'),
  },
};

export const Binary: Story = {
  args: {
    checked: false,
    disabled: false,
    withIcon: false,
    type: 'binary',
    label: 'Binary Switch',
    onChange: action('binary-changed'),
  },
};

export const WithIcon: Story = {
  args: {
    checked: true,
    disabled: false,
    withIcon: true,
    type: 'default',
    label: 'Switch with Icon',
    onChange: action('icon-changed'),
  },
};

export const PrimaryWithIcon: Story = {
  args: {
    checked: true,
    disabled: false,
    withIcon: true,
    type: 'primary',
    label: 'Primary Switch with Icon',
    onChange: action('primary-icon-changed'),
  },
};

export const BinaryWithIcon: Story = {
  args: {
    checked: false,
    disabled: false,
    withIcon: true,
    type: 'binary',
    label: 'Binary Switch with Icon',
    onChange: action('binary-icon-changed'),
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    withIcon: false,
    type: 'default',
    label: 'Disabled Switch',
    onChange: action('disabled-changed'),
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    withIcon: false,
    type: 'default',
    label: 'Disabled Checked Switch',
    onChange: action('disabled-checked-changed'),
  },
};

export const WithoutLabel: Story = {
  args: {
    checked: false,
    disabled: false,
    withIcon: true,
    type: 'default',
    onChange: action('no-label-changed'),
  },
};

export const AllVariants: Story = {
  render: () => {
    const handleChange = (variant: string) => (checked: boolean) => {
      action(`${variant}-changed`)(checked);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Default Off</span>
          <Switch 
            checked={false} 
            type="default" 
            onChange={handleChange('default-off')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Default On</span>
          <Switch 
            checked={true} 
            type="default" 
            onChange={handleChange('default-on')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Primary Off</span>
          <Switch 
            checked={false} 
            type="primary" 
            onChange={handleChange('primary-off')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Primary On</span>
          <Switch 
            checked={true} 
            type="primary" 
            onChange={handleChange('primary-on')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Binary Off</span>
          <Switch 
            checked={false} 
            type="binary" 
            onChange={handleChange('binary-off')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Binary On</span>
          <Switch 
            checked={true} 
            type="binary" 
            onChange={handleChange('binary-on')}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing all switch variants in different states.',
      },
    },
  },
};

export const WithIconsComparison: Story = {
  render: () => {
    const handleChange = (variant: string) => (checked: boolean) => {
      action(`${variant}-icon-changed`)(checked);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Default with Icon</span>
          <Switch 
            checked={true} 
            type="default" 
            withIcon={true}
            onChange={handleChange('default-icon')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Primary with Icon</span>
          <Switch 
            checked={true} 
            type="primary" 
            withIcon={true}
            onChange={handleChange('primary-icon')}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Binary with Icon</span>
          <Switch 
            checked={false} 
            type="binary" 
            withIcon={true}
            onChange={handleChange('binary-icon')}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing switches with icons in different variants.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  args: {
    checked: false,
    disabled: false,
    withIcon: false,
    type: 'default',
    label: 'Interactive Switch',
    onChange: action('playground-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all switch properties and see how they affect the component.',
      },
    },
  },
};
