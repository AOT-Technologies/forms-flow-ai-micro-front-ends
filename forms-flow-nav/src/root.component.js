import NavBar from "./Navbar";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "./sidenav/Sidebar";
import React, { useState } from "react";
import HamburgerMenu from "./sidenav/hamburgerMenu";
import "./Navbar.scss";

export default function Root(props) {
  const [tenantLogo, setTenantLogo] = React.useState("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACoCAMAAABt9SM9AAAAeFBMVEX///8BAQH8/Pz5+fnIyMjExMTn5+f19fXW1tbw8PChoaGxsbHX19fq6uqVlZWamprPz8/d3d2qqqpsbGyOjo69vb1nZ2d3d3cvLy8lJSVjY2M3NzdUVFSFhYV+fn48PDxERERMTEwoKCgeHh4MDAwWFhZDQ0NaWlpI396UAAAE9UlEQVR4nO3dDWKiMBAF4I0iCigiora12rqt7f1vuCtqa5SfJMyEoO87QJIGEoc82P3zBwAAAAAAAAAAAAAAAAAAAAAAAAAAwEyv7QF0yKDtAXRI6Lc9An5jor9xsaVpx1l+uEqHNE2NBE07bhouVuLdo2rNFylVU87xsichNhOy9gJxpzfWeLoTQjxHhE329vd4Y/npizh4SUibXd/djRX836SOsoC25VchQtoWW9UfbJ5PM/VEuf5yh2twN8V7En+Js+WIvPn4f7P3UWPNwm/xKyZefwfRoeHuF++TaH4xUWK94OhkdGj6i6Nle4aL7f5ypsR8zNLPJG+cfBu0yMvWQhYTPdRc633mzXd1ex+Hu6uJEm8s6y93/OV4YWuf0bnklNffjK/D057IdzGY/JackinT+suFp046tQp73uZv0Ux98V7y5NTNK2svpJL4vWiihFgxrr+D4NxRRx515JJTEva5Oz8/PwmeooRUIJeckncL2cHypzf+vhrpD65KTqvrL5f+XhkLvRlLsrfyiRKf/OvvYPbbo7MP0bPwtWKihNjZyu4u+nTyjNSPlqWTdLrG1h7+L39XyEIPKsPikvPSPrVXG6aXHTt1PNPzssKSU/Jq8/pOpK45nxH0jPIops7G7tV9kjq32nUpPy0tOS992N5hY7l/y70XCKLaTero2/r+Orsage3+Zf3B5kNtpihDZWXXG6j9EfxI4qqSU0IaKiubXg+jpQOaupJTQhwqqwpuBsKQGNXxK56LC1CHyspuLyd9EllpuNh+6swUfaisbHA7GouD6eVv/+hgCJXVFRx2bCx1PVYqOSUcobK6sGBEawv9FkYxNdYtp5m9wlExXz7lklPS6vrLZYXjYnyC0Cg5JVyhss7Qi0fGtQ41Sk55PE7kmJuS0THc8Volp4TppQ5dJTeWEDvafiZ6JaeENVTWEZcOke5hXrfklDCHyloqhknTgXbJKbESaqmKKgba/D0atVPOclMroZayyqs+bdKySckpsREqa7k+87tiWi5XBeuKti6tv6NtzZANSlPTkvOSpVBZU+2wNR+ok5t3OQ1YC5X1FJzNXPtSfkg0Lzkl9kJlTUo7i8o276d1wbqafejuC4eKf0L1CVLJu5wGrIbKupL68Z/s0sLFEXhh45+9H5ZDZV3FhzNlvrPIm02Cfn8Y+GMvilclb3IasR4qazM7LGHw3U6opaP4iNS+NkJlbepbFqNn59ffUVFQYVkH1t8J1S++sdZCZQPt7u9/u/WJXptT1X6opaf09J1fl9bfkd/STLX4Uoe5moM/JvOOrb8Tr4WpciBUNqNwmEWL8UtldpbvLM4vlflZ3bOcCZUNTer/RCIuhcqmLE2VU6GyMfP3DzQ4GWoZaJgYK3A01DJx86UAsZXbh+p6Rpwz9elwqGWEb6ruaP2d1b3pYMrZULkJlrLU5pfKVu3Ip8rpULkZ6i3e8VC5IaVPkBW5Hyo3NCSbqu6EWuYWNFOVdSFUbo4gPOzkobqZpq/rdfRQ3VCTN4f2YccP9bTtjG+qB9jUbxi9vfce3WmlXietnxvZU/gYP3+FJjuNmXp7hP+Mp9Kg/l+oyi2jzr2nwMGrLSJ204cqE6oFt//e9dnHPHXjy1uX9JLpXP6sbr3MotGdRDQs+v448bxkPAsetDwAAAAAAAAAAAAAAAAAAAAAAAAAAAD4B/UcPRFXugBuAAAAAElFTkSuQmCC");
  const [tenantName, setTenantName] = React.useState("nike");
  return (
    <Router>
      {/* <NavBar props={props} /> */}
      <>
      <div className="multitenancy-header">
        <img className="multitenancy-logo" src={tenantLogo} alt="custom logo" />
        <span className="multitenancy-app-name">{tenantName}</span>
      </div>
      <HamburgerMenu props={props} />
      <div className="main-sidenav">
        <Sidebar props={props} />
      </div>
      </>
    </Router>
  );
}
