import React from "react";
import { useState, useMemo } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "./hamburger.scss";
import Offcanvas from "react-bootstrap/Offcanvas";
import Sidebar from "./Sidebar";
import {
  HamburgerIcon,
  CloseIcon,
  ApplicationLogo,
} from "@formsflow/components";
import { StyleServices } from "@formsflow/service";
function HamburgerMenu({ props }) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const hideLogo = StyleServices?.getCSSVariable(
    "--hide-formsflow-logo"
  )?.toLowerCase();
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
    <Navbar expand="lg" className="bg-body-tertiary custom-navbar">
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
        <Navbar.Brand href="" className="mx-auto">
          {hideLogo !== "true" && (
            <ApplicationLogo data-testid="application-logo" />
          )}
        </Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav" className="order-2">
          <Nav className="me-auto">
            <Offcanvas show={show} onHide={handleClose} data-testid="offcanvas">
              <Offcanvas.Header className="offcanvas-header">
                <CloseIcon
                  onClick={handleClose}
                  data-testid="close-button"
                  aria-label="Close sidebar"
                />
              </Offcanvas.Header>
              <Offcanvas.Body>
                <div className="child-sidenav" data-testid="child-sidenav">
                  <Sidebar props={props} />
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
