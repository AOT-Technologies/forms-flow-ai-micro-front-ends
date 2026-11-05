import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SwitchCard } from "../CustomComponents/SwitchCard";

const meta: Meta<typeof SwitchCard> = {
  title: "Components/SwitchCard",
  component: SwitchCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A bordered card with a toggle switch, a title and an optional description. The card takes a tinted style while on; every colour can be overridden through the `colors` prop.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
    label: { control: "text" },
    description: { control: "text" },
    colors: { control: "object" },
  },
  render: (args) => <InteractiveSwitchCard {...args} />,
};

// Keeps the story toggleable; Storybook's `render` itself cannot hold hooks.
function InteractiveSwitchCard(args: React.ComponentProps<typeof SwitchCard>) {
  const [checked, setChecked] = useState(args.checked ?? false);
  return <SwitchCard {...args} checked={checked} onChange={setChecked} />;
}

export default meta;

type Story = StoryObj<typeof meta>;

export const On: Story = {
  args: {
    checked: true,
    label: "AI form submissions assistance is ON for this form",
  },
};

export const OffWithDescription: Story = {
  args: {
    checked: false,
    label: "AI form submissions assistance is OFF for this form",
    description:
      "This feature allows form creators to add context to their forms. This context allows an AI assistant to help those submitting the form.",
  },
};

export const CustomColors: Story = {
  args: {
    checked: true,
    label: "Custom colours",
    description: "Border, background and text colours set through `colors`.",
    colors: {
      checkedBorder: "var(--ff-primary-light)",
      checkedBackground: "var(--white-300)",
      label: "var(--ff-primary)",
      description: "var(--gray-darkest)",
    },
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: "This setting is locked",
  },
};
