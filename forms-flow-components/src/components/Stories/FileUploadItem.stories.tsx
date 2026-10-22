import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { FileUploadItem } from "../CustomComponents/FileUploadItem";

const meta: Meta<typeof FileUploadItem> = {
  title: "Components/FileUploadItem",
  component: FileUploadItem,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A single uploaded-file row with uploading, success and error states. Uses CustomProgressBar for the uploading and error states. Action buttons render only when their handler is supplied.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["uploading", "success", "error"],
    },
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
  args: {
    onCancel: action("cancel"),
    onRetry: action("retry"),
    onDownload: action("download"),
    onEdit: action("edit"),
    onDelete: action("delete"),
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Uploading: Story = {
  args: {
    status: "uploading",
    fileName: "Filename_123.pdf",
    progress: 15,
  },
};

export const Success: Story = {
  args: {
    status: "success",
    fileName: "Policy 56677",
  },
};

export const Error: Story = {
  args: {
    status: "error",
    fileName: "Filename_123.pdf",
    progress: 15,
  },
};

export const AllStates: Story = {
  render: (args) => (
    <div className="file-upload-item-list">
      <FileUploadItem
        {...args}
        status="uploading"
        fileName="Filename_123.pdf"
        progress={15}
      />
      <FileUploadItem {...args} status="success" fileName="Policy 56677" />
      <FileUploadItem
        {...args}
        status="error"
        fileName="Filename_123.pdf"
        progress={15}
      />
    </div>
  ),
};
