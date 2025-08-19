import { Link, useNavigate } from "react-router-dom";
import supabase from "../services/supabaseClient";
import "./Header.css";
import logo from "../assets/BB-EDTECH.png"; // ✅ import your logo

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="top-nav">
      <div className="brand">
        <img src={logo} alt="BB EDTECH.AI Logo" className="brand-logo" />
        BB EDTECH.AI
      </div>
      <nav className="nav-tabs">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/history">History</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/report">Report</Link>
        <a href="/" onClick={handleLogout}>Logout</a>
      </nav>
    </header>
  );
}
