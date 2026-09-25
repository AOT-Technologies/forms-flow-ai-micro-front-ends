import React from "react";
import { useState, useMemo } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "./hamburger.scss";
import Offcanvas from "react-bootstrap/Offcanvas";
import Sidebar from "./Sidebar";
import { HamburgerIcon } from "@formsflow/components";
function HamburgerMenu({ props }) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // Theme CSS variable is set at app bootstrap; avoid a synchronous
  // getComputedStyle() read on every render (N.1.3).
  const hamburgerIconColor = useMemo(
    () =>
      getComputedStyle(document.documentElement).getPropertyValue(
        "--ff-gray-darkest"
      ),
    []
  );

  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <button
          aria-controls="basic-navbar-nav"
          className="navbar-toggler order-0"
          onClick={handleShow}
          data-testid="hamburger-button"
          aria-label="Open sidebar"
        >
          <HamburgerIcon
            data-testid="hamburger-button"
            aria-label="hamburger button"
            color={hamburgerIconColor}
          />
        </button>
        {/* No brand logo here: the collapsed mobile state is the hamburger
            alone, and the logo belongs to the expanded menu the hamburger
            opens (see renderLogo in Sidebar). */}
        <Navbar.Collapse id="basic-navbar-nav" className="order-2">
          <Nav className="me-auto">
            <Offcanvas show={show} onHide={handleClose} data-testid="offcanvas">
              <Offcanvas.Body>
                <div className="child-sidenav" data-testid="child-sidenav">
                  {/* Opens as the full labelled menu: on mobile the nav is
                      either shut behind this hamburger or open in full, with
                      no collapsed rail tier in between. */}
                  <Sidebar props={props} overlay onToggle={handleClose} />
                </div>
              </Offcanvas.Body>
            </Offcanvas>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default HamburgerMenu;
