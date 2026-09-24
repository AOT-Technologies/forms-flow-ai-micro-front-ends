import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ApplicationLogoFull } from "../SvgIcons";

const meta: Meta<typeof ApplicationLogoFull> = {
  title: "Brand/Application Logo",
  component: ApplicationLogoFull,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The full brand lockup as a SINGLE asset: the mark and the " +
          "`formsflow.ai` wordmark are one SVG, never an icon paired with " +
          "CSS-styled text, so letterforms, spacing and tracking cannot drift " +
          "between the surfaces that render it. Use `ApplicationLogo` when only " +
          "the mark is wanted (the collapsed nav rail, favicons). Colours are " +
          "props purely so a tenant theme can override them — the defaults are " +
          "the brand values and should be left alone otherwise.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    markColor: { control: "color" },
    wordmarkColor: { control: "color" },
    accentColor: { control: "color" },
    width: { control: "number" },
    height: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof ApplicationLogoFull>;

/** The asset at its intrinsic 144x26. */
export const Default: Story = {};

/** The size the expanded nav rail draws it at (Figma "logomark branded"). */
export const NavRail: Story = {
  args: {
    width: 107,
    height: 20,
  },
};
