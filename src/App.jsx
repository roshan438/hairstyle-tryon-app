import React from "react"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TryOn from "./pages/TryOn";
import BookBarber from "./pages/BookBarber";
import Navbar from "./components/Navbar";
function App() {
  return (
    <Router>
        <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tryon" element={<TryOn />} />
        <Route path="/book" element={<BookBarber />} />
      </Routes>
    </Router>
  );
}

export default App;
