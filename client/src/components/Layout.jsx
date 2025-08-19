import { Outlet } from "react-router-dom";
import Header from "./Header"; // adjust path to your header

export default function Layout() {
  return (
    <div className="layout-wrapper">
      <Header />
      <main>
        <Outlet /> {/* This is where the nested page will render */}
      </main>
    </div>
  );
}
