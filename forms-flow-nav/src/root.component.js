import NavBar from "./Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "./sidenav/Sidebar";
import React, { useRef, useEffect, useState } from "react";
import "./Navbar.scss";
import HamburgerMenu from "./sidenav/hamburgerMenu";
import { StyleServices } from "@formsflow/service";

export default function Root(props) {
  const customLogoPath =  StyleServices?.getCSSVariable("--custom-logo-path");
  const customTitle = StyleServices?.getCSSVariable("--custom-title");
  const headerRef = useRef(null); 
  const sidenavRef = useRef(null); 
  const [sidenavHeight, setSidenavHeight] = useState("100%");
  const hasMultitenancyHeader = customLogoPath || customTitle;
  const [isPreviewRoute,setIsPreviewRoute] = useState(false);
   
  useEffect(() => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    const totalHeight = `calc(100% - ${headerHeight}px)`;
    setSidenavHeight(totalHeight);
  }, [ hasMultitenancyHeader ]); 

  useEffect(()=>{
    const location = window.location.pathname;
    if(location.includes("view-edit")){
      setIsPreviewRoute(true);
    }
  })
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
        { !isPreviewRoute && <div className="main-sidenav" ref={sidenavRef}>
          <Sidebar props={props} sidenavHeight={sidenavHeight}/>
        </div>}
      </>
    </Router>
  );
}
