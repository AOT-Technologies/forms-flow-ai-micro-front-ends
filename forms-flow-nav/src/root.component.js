import NavBar from "./Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "./sidenav/Sidebar";
import React, { useState } from "react";
import "./Navbar.scss";
import HamburgerMenu from "./sidenav/hamburgerMenu";
import TenantHeader from "./sidenav/TenantHeader";
import {
  MULTITENANCY_ENABLED,
} from "./constants/constants";

export default function Root(props) {
  return (
    <Router>
      {/* <NavBar props={props} /> */}
      <>
      {MULTITENANCY_ENABLED && <TenantHeader props={props} />}
      <HamburgerMenu props={props} />
      <div className="main-sidenav">
        <Sidebar props={props} />
      </div>
      </>
    </Router>
  );
}
