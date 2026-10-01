import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { StyleServices } from "@formsflow/service";
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

  it("starts collapsed regardless of viewport width", () => {
    // Regression: the nav used to open itself on any viewport wider than
    // 1200px, so it never stayed closed across a refresh.
    window.innerWidth = 1920;
    render(<Root {...buildProps()} />);
    expect(screen.getByTestId("sidenav")).toHaveClass("collapsed");
  });

  it("returns to collapsed after a refresh even once expanded", () => {
    // The expanded state is intentionally not persisted: a fresh page load
    // must always come back collapsed.
    const first = render(<Root {...buildProps()} />);
    fireEvent.click(screen.getByTestId("sidenav-toggle-btn"));
    expect(screen.getByTestId("sidenav")).not.toHaveClass("collapsed");

    first.unmount();
    render(<Root {...buildProps()} />);
    expect(screen.getByTestId("sidenav")).toHaveClass("collapsed");
  });

  it("publishes the rail width on the document root, not just the rail", () => {
    // The theme's .nav-space gutter sizes itself from --navbar-width. Setting it
    // as an inline style on .sidenav left the gutter at the 3rem default while
    // the expanded rail grew to 11rem, so the rail covered the page canvas.
    const setVar = jest.spyOn(StyleServices, "setCSSVariable");
    render(<Root {...buildProps()} />);
    expect(setVar).toHaveBeenCalledWith("--navbar-width", "3rem");
    expect(screen.getByTestId("sidenav")).not.toHaveAttribute(
      "style",
      expect.stringContaining("--navbar-width")
    );

    setVar.mockClear();
    fireEvent.click(screen.getByTestId("sidenav-toggle-btn"));
    expect(setVar).toHaveBeenCalledWith("--navbar-width", "11rem");
    setVar.mockRestore();
  });

  const openOverlay = () => {
    // The testid is on both the button and the icon it wraps.
    fireEvent.click(screen.getAllByTestId("hamburger-button")[0]);
    return within(screen.getByTestId("child-sidenav")).getByTestId("sidenav");
  };

  it("opens the mobile overlay as the full menu, not the collapsed rail", () => {
    // Mobile has no rail tier: the nav is either shut behind the hamburger or
    // open as the full labelled menu, so the overlay copy starts EXPANDED.
    render(<Root {...buildProps()} />);
    const overlayNav = openOverlay();
    expect(overlayNav).toHaveClass("sidenav-overlay");
    expect(overlayNav).not.toHaveClass("collapsed");
  });

  it("dismisses the mobile overlay from its header toggle, never collapsing it", async () => {
    render(<Root {...buildProps()} />);
    const overlayNav = openOverlay();
    fireEvent.click(
      within(screen.getByTestId("child-sidenav")).getByTestId(
        "sidenav-toggle-btn"
      )
    );
    expect(overlayNav).not.toHaveClass("collapsed");
    await waitFor(() =>
      expect(screen.queryByTestId("child-sidenav")).not.toBeInTheDocument()
    );
  });

  it("never lets the overlay publish the page gutter width", () => {
    const setVar = jest.spyOn(StyleServices, "setCSSVariable");
    render(<Root {...buildProps()} />);
    setVar.mockClear();
    openOverlay();
    expect(setVar).not.toHaveBeenCalled();
    setVar.mockRestore();
  });

  it("subscribes to route changes for hiding the sidebar", () => {
    const props = buildProps();
    render(<Root {...props} />);
    const events = props.subscribe.mock.calls.map((call) => call[0]);
    expect(events).toContain("ES_ROUTE");
  });
});
