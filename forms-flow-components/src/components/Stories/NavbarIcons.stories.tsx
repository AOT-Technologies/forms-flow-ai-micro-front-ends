import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  NavbarHomeIcon,
  NavbarTaskIcon,
  NavbarBuildIcon,
  NavbarFormsIcon,
  NavbarBundlesIcon,
  NavbarSubflowsIcon,
  NavbarDecisionTablesIcon,
  NavbarAnalyzeIcon,
  NavbarSubmissionsIcon,
  NavbarManageIcon,
  NavbarSubmitIcon,
  NavbarUserIcon,
  MenuToggleIcon,
  LogoutIcon,
} from "../SvgIcons";

const ICONS = [
  { name: "NavbarHomeIcon", Icon: NavbarHomeIcon },
  { name: "NavbarTaskIcon", Icon: NavbarTaskIcon },
  { name: "NavbarBuildIcon", Icon: NavbarBuildIcon },
  { name: "NavbarFormsIcon", Icon: NavbarFormsIcon },
  { name: "NavbarBundlesIcon", Icon: NavbarBundlesIcon },
  { name: "NavbarSubflowsIcon", Icon: NavbarSubflowsIcon },
  { name: "NavbarDecisionTablesIcon", Icon: NavbarDecisionTablesIcon },
  { name: "NavbarAnalyzeIcon", Icon: NavbarAnalyzeIcon },
  { name: "NavbarSubmissionsIcon", Icon: NavbarSubmissionsIcon },
  { name: "NavbarManageIcon", Icon: NavbarManageIcon },
  { name: "NavbarSubmitIcon", Icon: NavbarSubmitIcon },
  { name: "NavbarUserIcon", Icon: NavbarUserIcon },
  { name: "MenuToggleIcon", Icon: MenuToggleIcon },
  { name: "LogoutIcon", Icon: LogoutIcon },
];

interface GridProps {
  /** Stroke colour applied to every glyph — drives the active/inactive state. */
  strokeColor: string;
  /** Backdrop fill behind the stroke. Stays neutral across states. */
  fillColor: string;
  /** Swatch background, to check the glyphs against the rail colour. */
  background: string;
}

const NavbarIconGrid = ({ strokeColor, fillColor, background }: GridProps) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))",
      gap: "1rem",
      background,
      padding: "1rem",
    }}
  >
    {ICONS.map(({ name, Icon }) => (
      <div
        key={name}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <Icon strokeColor={strokeColor} fillColor={fillColor} />
        <span style={{ fontSize: "0.75rem" }}>{name}</span>
      </div>
    ))}
  </div>
);

const meta: Meta<typeof NavbarIconGrid> = {
  title: "Icons/Navbar Icons",
  component: NavbarIconGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Phase 3 navbar glyph set. Every icon is a 20x20 stroke-drawn lucide " +
          "glyph over a filled disc: `strokeColor` carries the active/inactive " +
          "state, while `fillColor` is only the backdrop behind the stroke and " +
          "stays neutral. Rendered here against the collapsed rail background.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    strokeColor: { control: "color" },
    fillColor: { control: "color" },
    background: { control: "color" },
  },
};

export default meta;
type Story = StoryObj<typeof NavbarIconGrid>;

/** Default rail state: gray stroke on a white disc. */
export const Inactive: Story = {
  args: {
    strokeColor: "#979899",
    fillColor: "#ffffff",
    background: "#f6f6f6",
  },
};

/** Selected row: the stroke turns indigo, the disc stays white. */
export const Active: Story = {
  args: {
    strokeColor: "#5467fc",
    fillColor: "#ffffff",
    background: "#f6f6f6",
  },
};
