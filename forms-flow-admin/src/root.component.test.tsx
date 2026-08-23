import { render, screen } from "@testing-library/react";
import Root from "./root.component";

// The single-spa root-config supplies these callbacks at runtime.
const buildProps = () => ({
  subscribe: jest.fn(),
  publish: jest.fn(),
  getKcInstance: () => ({
    isAuthenticated: () => false,
    userLogout: jest.fn(),
  }),
});

describe("Root component", () => {
  it("renders the billing return screen at /billing/return", () => {
    // No session_id in the query string -> the screen shows its
    // "missing session" status message (jsdom cannot follow the redirect).
    window.history.pushState({}, "", "/billing/return");
    render(<Root {...buildProps()} />);
    expect(
      screen.getByText("Missing session id. Redirecting...")
    ).toBeInTheDocument();
  });

  it("renders the billing manage screen at /billing/manage", async () => {
    // No tenant key in path, query, or storage -> the screen surfaces its
    // "unable to open" status message instead of redirecting.
    window.history.pushState({}, "", "/billing/manage");
    render(<Root {...buildProps()} />);
    expect(
      await screen.findByText(
        "Unable to open subscription management: Tenant key not found. Please login and try again."
      )
    ).toBeInTheDocument();
  });
});
