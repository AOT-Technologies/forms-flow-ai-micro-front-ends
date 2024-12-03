import NavBar from "./Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "./sidenav/Sidebar";
import React, { useState } from "react";
import "./Navbar.scss";
import HamburgerMenu from "./sidenav/hamburgerMenu";

export default function Root(props) {
  const customLogoPath =  document.documentElement.style.getPropertyValue("--custom-logo-path");
  const customTitle =
    document.documentElement.style.getPropertyValue("--custom-title");
    console.log(customLogoPath,customTitle,"test");
  return (
    <Router>
      {/* <NavBar props={props} /> */}
      <>
      {(customLogoPath || customTitle) && (
          <div className="multitenancy-header">
            {customLogoPath && (
              <img
                className="multitenancy-logo"
                src={customLogoPath}
                alt="custom logo"
              />
            )}
            {customTitle && (
              <span className="multitenancy-app-name">{customTitle}</span>
            )}
          </div>
        )}
        <HamburgerMenu props={props} />
        <div className="main-sidenav">
          <Sidebar props={props} />
        </div>
      </>
    </Router>
  );
}
