import React from "react";
import { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import "./hamburger.scss";
// import Appname from "./formsflow.svg";
import Offcanvas from "react-bootstrap/Offcanvas";
import Sidebar from "./Sidebar";
// import hamburger from "./hamburger.svg";
// import closebutton from "./closebutton.svg";
import { HamburgerIcon, CloseIcon, ApplicationLogo } from "@formsflow/components";
function HamburgerMenu({ props }) {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
          {/* <img src={hamburger} alt="hamburger icon" /> */}
          <HamburgerIcon data-testid="hamburger-button" aria-label="hamburger button" color={getComputedStyle(document.documentElement).getPropertyValue("--ff-gray-dark")} />
        </button>
        <Navbar.Brand href="" className="mx-auto">
          {/* <img className="" src={Appname} alt="applicationName" /> */}
          <ApplicationLogo data-testid="application-logo" />
        </Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav" className="order-2">
          <Nav className="me-auto">
            <Offcanvas show={show} onHide={handleClose} data-testid="offcanvas">
              <Offcanvas.Header className="offcanvas-header">
                {/* <img
                  src={closebutton}
                  alt="close icon"
                  onClick={handleClose}
                  data-testid="close-button"
                  aria-label="Close sidebar"
                /> */}
                <CloseIcon onClick={handleClose} data-testid="close-button" aria-label="Close sidebar" />
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
