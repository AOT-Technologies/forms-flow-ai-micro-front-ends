import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { FileUploadArea } from '../CustomComponents/FileUploadArea';

const meta: Meta<typeof FileUploadArea> = {
  title: 'Components/FileUploadArea',
  component: FileUploadArea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A drag-and-drop file upload component with progress tracking, error handling, and multiple file type support. Features accessible design with keyboard navigation and screen reader support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    fileType: {
      control: 'text',
      description: 'Accepted file types (e.g., ".json", ".bpmn", ".pdf")',
    },
    onFileSelect: {
      action: 'file-selected',
      description: 'Called when a file is selected',
    },
    onCancel: {
      action: 'canceled',
      description: 'Called when upload is canceled',
    },
    onRetry: {
      action: 'retried',
      description: 'Called when retry is clicked',
    },
    onDone: {
      action: 'done',
      description: 'Called when done is clicked',
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Template to manage file state for interactive stories
const FileUploadTemplate = (args: any) => {
  const [file, setFile] = useState<File | null>(args.file || null);
  const [progress, setProgress] = useState(args.progress || 0);
  const [error, setError] = useState<string | null>(args.error || null);

  const simulateProgress = (speed: number = 10) => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + speed;
      });
    }, 200);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setProgress(0);
    setError(null);
    simulateProgress(10);
    action('file-selected')(selectedFile);
  };

  const handleCancel = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    action('canceled')();
  };

  const handleRetry = (retryFile: File) => {
    setError(null);
    setProgress(0);
    simulateProgress(15);
    action('retried')(retryFile);
  };

  const handleDone = () => {
    setFile(null);
    setProgress(0);
    setError(null);
    action('done')();
  };

  return (
    <div style={{ width: '400px', height: '300px' }}>
      <FileUploadArea
        {...args}
        file={file}
        progress={progress}
        error={error}
        onFileSelect={handleFileSelect}
        onCancel={handleCancel}
        onRetry={handleRetry}
        onDone={handleDone}
      />
    </div>
  );
};

// Initial state - no file selected
export const Default: Story = {
  args: {
    fileType: '.json, .bpmn',
  },
  render: FileUploadTemplate,
};

// Different file types
export const JSONFileType: Story = {
  args: {
    fileType: '.json',
  },
  render: FileUploadTemplate,
};

// Upload states
export const Uploading: Story = {
  args: {
    fileType: '.json, .bpmn',
    file: new File(['{"test": "data"}'], 'test.json', { type: 'application/json' }),
    progress: 45,
  },
  render: FileUploadTemplate,
};

export const UploadComplete: Story = {
  args: {
    fileType: '.json, .bpmn',
    file: new File(['{"test": "data"}'], 'test.json', { type: 'application/json' }),
    progress: 100,
  },
  render: FileUploadTemplate,
};

export const UploadError: Story = {
  args: {
    fileType: '.json, .bpmn',
    file: new File(['{"test": "data"}'], 'test.json', { type: 'application/json' }),
    progress: 30,
    error: 'File upload failed. Please try again.',
  },
  render: FileUploadTemplate,
};

// Edge cases
export const LargeFileName: Story = {
  args: {
    fileType: '.json, .bpmn',
    file: new File(['{"test": "data"}'], 'very-long-file-name-that-might-cause-layout-issues.json', { type: 'application/json' }),
    progress: 75,
  },
  render: FileUploadTemplate,
};

export const NetworkError: Story = {
  args: {
    fileType: '.json, .bpmn',
    file: new File(['{"test": "data"}'], 'test.json', { type: 'application/json' }),
    progress: 60,
    error: 'Network connection lost. Please check your internet connection and try again.',
  },
  render: FileUploadTemplate,
};

// Interactive playground
export const Playground: Story = {
  args: {
    fileType: '.json, .bpmn',
  },
  render: FileUploadTemplate,
  parameters: {
    docs: {
      description: {
        story: 'Use controls to adjust props and observe behavior. Try uploading different file types and watch the progress simulation.',
      },
    },
  },
};
