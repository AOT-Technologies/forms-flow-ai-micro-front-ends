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
  it("renders the sidenav shell", () => {
    render(<Root {...buildProps()} />);
    expect(screen.getByTestId("main-sidenav")).toBeInTheDocument();
    expect(screen.getByTestId("sidenav")).toBeInTheDocument();
  });

  it("subscribes to route changes for hiding the sidebar", () => {
    const props = buildProps();
    render(<Root {...props} />);
    const events = props.subscribe.mock.calls.map((call) => call[0]);
    expect(events).toContain("ES_ROUTE");
  });
});
