import NavBar from "./Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "./sidenav/Sidebar";
import React, { useRef, useEffect, useState } from "react";
import "./Navbar.scss";
import HamburgerMenu from "./sidenav/hamburgerMenu";

export default function Root(props) {
  const customLogoPath =  document.documentElement.style.getPropertyValue("--custom-logo-path");
  const customTitle =
    document.documentElement.style.getPropertyValue("--custom-title"); 
  const headerRef = useRef(null); 
  const sidenavRef = useRef(null); 
  const [sidenavHeight, setSidenavHeight] = useState("100%");
  const hasMultitenancyHeader = customLogoPath || customTitle;
  useEffect(() => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    const totalHeight = `calc(100% - ${headerHeight}px)`;
    setSidenavHeight(totalHeight);
  }, [ hasMultitenancyHeader ]); 

  return (
    <Router>
      {/* <NavBar props={props} /> */}
      <>
      {hasMultitenancyHeader && (
          <div ref={headerRef} className="multitenancy-header">
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
        <div className="main-sidenav" ref={sidenavRef}>
          <Sidebar props={props} sidenavHeight={sidenavHeight}/>
        </div>
      </>
    </Router>
  );
}
