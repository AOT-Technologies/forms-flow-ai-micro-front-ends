import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomCheckbox } from '../CustomComponents/CustomCheckbox';

const meta: Meta<typeof CustomCheckbox> = {
  title: 'Components/CustomCheckbox',
  component: CustomCheckbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible single checkbox component with i18n labels, size variants, and controlled state support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'small'],
      description: 'Size variant: default (33px) or small (16px)',
    },
    label: {
      control: 'text',
      description: 'Text label or translation key for the checkbox',
    },
    name: {
      control: 'text',
      description: 'Checkbox name attribute',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state (controlled)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the checkbox',
    },
    required: {
      control: 'boolean',
      description: 'Mark the checkbox as required',
    },
    value: {
      control: 'text',
      description: 'Value attribute for the checkbox',
    },
    wrapperClassName: {
      control: 'text',
      description: 'Additional class for the checkbox wrapper',
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing',
    },
    onChange: {
      action: 'changed',
      description: 'Called with (checked, event) when checkbox state changes',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template to keep the component controlled for interactive stories
const ControlledTemplate = (args: any) => {
  const [checked, setChecked] = React.useState(args.checked || false);
  return (
    <div style={{ width: '400px', minHeight: '150px' }}>
      <CustomCheckbox
        {...args}
        checked={checked}
        onChange={(newChecked: boolean, event: React.ChangeEvent<HTMLInputElement>) => {
          setChecked(newChecked);
          // Forward to provided action handler if any
          if (typeof args.onChange === 'function') {
            args.onChange(newChecked, event);
          } else {
            action('changed')(newChecked, event);
          }
        }}
      />
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Checked:</strong> {checked ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

export const Basic: Story = {
  args: {
    name: 'demo-checkbox',
    label: 'I agree to the terms and conditions',
    checked: true,
    variant: 'primary',
    dataTestId: 'checkbox-basic',
  },
  render: ControlledTemplate,
};

export const Unchecked: Story = {
  args: {
    name: 'demo-checkbox-unchecked',
    label: 'Subscribe to newsletter',
    checked: false,
    variant: 'primary',
    dataTestId: 'checkbox-unchecked',
  },
  render: ControlledTemplate,
};

export const Disabled: Story = {
  args: {
    name: 'demo-checkbox-disabled',
    label: 'This option is disabled',
    checked: false,
    disabled: true,
    variant: 'primary',
    dataTestId: 'checkbox-disabled',
  },
  render: ControlledTemplate,
};

export const DisabledChecked: Story = {
  args: {
    name: 'demo-checkbox-disabled-checked',
    label: 'This option is disabled and checked',
    checked: true,
    disabled: true,
    variant: 'primary',
    dataTestId: 'checkbox-disabled-checked',
  },
  render: ControlledTemplate,
};

export const Required: Story = {
  args: {
    name: 'demo-checkbox-required',
    label: 'I accept the terms (required)',
    required: true,
    checked: false,
    dataTestId: 'checkbox-required',
  },
  render: ControlledTemplate,
};

export const SecondaryVariant: Story = {
  args: {
    name: 'demo-checkbox-secondary',
    label: 'Secondary style checkbox',
    checked: true,
    variant: 'secondary',
    dataTestId: 'checkbox-secondary',
  },
  render: ControlledTemplate,
};

export const LongLabel: Story = {
  args: {
    name: 'demo-checkbox-long',
    label: 'This is a very long checkbox label that might wrap to multiple lines in order to demonstrate how the component handles lengthy text content',
    checked: true,
    dataTestId: 'checkbox-long',
  },
  render: ControlledTemplate,
};

export const SmallSize: Story = {
  args: {
    name: 'demo-checkbox-small',
    label: 'Small size checkbox',
    checked: true,
    size: 'small',
    variant: 'primary',
    dataTestId: 'checkbox-small',
  },
  render: ControlledTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Compact 16px checkbox variant for dense UIs or inline forms.',
      },
    },
  },
};

export const SmallSecondary: Story = {
  args: {
    name: 'demo-checkbox-small-secondary',
    label: 'Small secondary variant',
    checked: true,
    size: 'small',
    variant: 'secondary',
    dataTestId: 'checkbox-small-secondary',
  },
  render: ControlledTemplate,
};

export const SmallDisabled: Story = {
  args: {
    name: 'demo-checkbox-small-disabled',
    label: 'Small disabled checkbox',
    checked: true,
    size: 'small',
    disabled: true,
    dataTestId: 'checkbox-small-disabled',
  },
  render: ControlledTemplate,
};

export const WithValue: Story = {
  args: {
    name: 'preferences',
    label: 'Enable notifications',
    value: 'notifications',
    checked: true,
    dataTestId: 'checkbox-with-value',
  },
  render: ControlledTemplate,
};

export const SizeComparison: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '400px' }}>
      <div>
        <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>Default Size (33px)</h4>
        <CustomCheckbox
          name="comparison-default"
          label="Default size checkbox"
          checked={true}
          dataTestId="comparison-default"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>Small Size (16px)</h4>
        <CustomCheckbox
          name="comparison-small"
          label="Small size checkbox"
          checked={true}
          size="small"
          dataTestId="comparison-small"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of default (33px) and small (16px) size variants.',
      },
    },
  },
};

export const VariantComparison: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '400px' }}>
      <div>
        <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>Primary Variant</h4>
        <CustomCheckbox
          name="variant-primary"
          label="Primary style checkbox"
          checked={true}
          variant="primary"
          dataTestId="variant-primary"
        />
      </div>
      <div>
        <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>Secondary Variant</h4>
        <CustomCheckbox
          name="variant-secondary"
          label="Secondary style checkbox"
          checked={true}
          variant="secondary"
          dataTestId="variant-secondary"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of primary and secondary style variants.',
      },
    },
  },
};

export const MultipleCheckboxes: Story = {
  args: {},
  render: () => {
    const [permissions, setPermissions] = React.useState({
      read: true,
      write: false,
      delete: false,
    });

    return (
      <div style={{ width: '400px' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>User Permissions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <CustomCheckbox
            name="permission-read"
            label="Read access"
            checked={permissions.read}
            onChange={(checked) => setPermissions({ ...permissions, read: checked })}
          />
          <CustomCheckbox
            name="permission-write"
            label="Write access"
            checked={permissions.write}
            onChange={(checked) => setPermissions({ ...permissions, write: checked })}
          />
          <CustomCheckbox
            name="permission-delete"
            label="Delete access"
            checked={permissions.delete}
            onChange={(checked) => setPermissions({ ...permissions, delete: checked })}
          />
        </div>
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Selected Permissions:</strong> {Object.entries(permissions).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple independent checkboxes working together.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    name: 'demo-checkbox-playground',
    label: 'Playground checkbox',
    checked: true,
    disabled: false,
    required: false,
    variant: 'primary',
    size: 'default',
    dataTestId: 'checkbox-playground',
    onChange: action('checkbox-changed'),
  },
  render: ControlledTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use controls to adjust props and observe behavior. Toggle size between default (33px) and small (16px). onChange logs the checked state.',
      },
    },
  },
};
