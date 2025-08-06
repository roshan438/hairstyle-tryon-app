import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.scss"; // We’ll style this next
//this is done now ai
function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">💇‍♂️ TryOnApp</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/tryon">Try On</Link></li>
        <li><Link to="/book">Book Barber</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
