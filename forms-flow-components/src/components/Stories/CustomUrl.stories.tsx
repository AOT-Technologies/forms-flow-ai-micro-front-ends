import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { CustomUrl } from '../CustomComponents/CustomUrl';

const meta: Meta<typeof CustomUrl> = {
  title: 'Components/CustomUrl',
  component: CustomUrl,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile URL input component with copy functionality and save capabilities. Built with TypeScript, React.memo, and forwardRef for optimal performance and composability.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    baseUrl: { 
      control: 'text', 
      description: 'Base URL that will be prepended to the custom URL input'
    },
    initialUrl: { 
      control: 'text', 
      description: 'Initial full URL value (will extract slug from base URL)'
    },
    saveButtonText: {
      control: 'text',
      description: 'Text for the save button'
    },
    dataTestId: {
      control: 'text',
      description: 'Test ID for automated testing'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the URL input'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input field'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled'
    },
    onSave: { 
      action: 'saved',
      description: 'Callback when URL is saved'
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    baseUrl: 'https://example.com/',
    initialUrl: 'https://example.com/dashboard',
    saveButtonText: 'Save URL',
    onSave: action('url-saved'),
  },
};

export const WithInitialUrl: Story = {
  args: {
    baseUrl: 'https://example.com/',
    initialUrl: 'https://example.com/custom-path',
    saveButtonText: 'Save URL',
    onSave: action('url-saved'),
  },
};

export const WithCustomBaseUrl: Story = {
  args: {
    baseUrl: 'https://myapp.com/api/v1/',
    initialUrl: 'https://myapp.com/api/v1/users',
    saveButtonText: 'Save URL',
    onSave: action('url-saved'),
  },
};

export const WithCustomSaveText: Story = {
  args: {
    baseUrl: 'https://example.com/',
    initialUrl: 'https://example.com/settings',
    saveButtonText: 'Update URL',
    onSave: action('url-saved'),
  },
};

export const WithFullInitialUrl: Story = {
  args: {
    baseUrl: 'https://formsflow.ai/',
    initialUrl: 'https://formsflow.ai/admin/dashboard',
    saveButtonText: 'Save URL',
    onSave: action('url-saved'),
  },
};

export const Disabled: Story = {
  args: {
    baseUrl: 'https://example.com/',
    initialUrl: '',
    saveButtonText: 'Save URL',
    disabled: true,
    onSave: action('url-saved'),
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    baseUrl: 'https://api.example.com/v1/',
    initialUrl: 'https://api.example.com/v1/endpoints',
    saveButtonText: 'Save URL',
    placeholder: 'Enter your custom endpoint',
    onSave: action('url-saved'),
  },
};

export const WithCustomAriaLabel: Story = {
  args: {
    baseUrl: 'https://example.com/',
    initialUrl: 'https://example.com/app',
    saveButtonText: 'Save URL',
    ariaLabel: 'Custom URL for your application',
    onSave: action('url-saved'),
  },
};

export const WithSpecialCharacters: Story = {
  args: {
    baseUrl: 'https://example.com/api/',
    initialUrl: 'https://example.com/api/users?filter=active&sort=name',
    saveButtonText: 'Save URL',
    onSave: action('url-saved'),
  },
};

export const MultipleInstances: Story = {
  render: () => {
    const handleSave1 = (url: string) => action('url-1-saved')(url);
    const handleSave2 = (url: string) => action('url-2-saved')(url);
    const handleSave3 = (url: string) => action('url-3-saved')(url);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '600px' }}>
        <div>
          <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>API Endpoint</h3>
          <CustomUrl
            baseUrl="https://api.example.com/v1/"
            initialUrl=""
            saveButtonText="Save API URL"
            onSave={handleSave1}
          />
        </div>
        
        <div>
          <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>Webhook URL</h3>
          <CustomUrl
            baseUrl="https://webhooks.example.com/"
            initialUrl="https://webhooks.example.com/notifications"
            saveButtonText="Save Webhook"
            onSave={handleSave2}
          />
        </div>
        
        <div>
          <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>Redirect URL</h3>
          <CustomUrl
            baseUrl="https://app.example.com/redirect/"
            initialUrl=""
            saveButtonText="Save Redirect"
            onSave={handleSave3}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Example showing multiple CustomUrl components for different use cases.',
      },
    },
  },
};

// Interactive playground story
export const Playground: Story = {
  args: {
    baseUrl: 'https://example.com/',
    initialUrl: 'https://example.com/playground',
    saveButtonText: 'Save URL',
    dataTestId: 'playground-url',
    onSave: action('playground-saved'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Use the controls panel below to experiment with all CustomUrl properties and see how they affect the component.',
      },
    },
  },
};
