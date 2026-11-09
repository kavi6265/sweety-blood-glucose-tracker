
import { useState } from "react";
import ReadingForm from "../components/ReadingForm";
import ReadingList from "../components/ReadingList";
import ReportCards from "../components/ReportCards";
import GlucoseChart from "../components/GlucoseChart";
import GlucoseSummary from "../components/GlucoseSummary";
import Profile from "../components/Profile";
import "./Dashboard.css";

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const menuItems = [
    "Dashboard",
    "Add Reading",
    "Reading History",
    "Reports",
  ];

  function navigateTo(menu) {
    setActiveMenu(menu);
    setSidebarOpen(false);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  function refreshReadings() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <div className="sweety-app">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sweety-sidebar"
        className={`sweety-sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="sweety-brand">
          <div className="brand-icon">
             <img src="/sweety-logo.png" alt="Sweety logo" />
          </div>
          <div>
            <h2>Sweety</h2>
            <p>Glucose Tracker</p>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav className="sweety-nav">
          {menuItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`sweety-nav-item ${
                activeMenu === item ? "selected" : ""
              }`}
              onClick={() => navigateTo(item)}
            >
              <span className="nav-number">
                {["⌂", "+", "▤", "▥"][index]}
              </span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="user-profile"
            onClick={() => navigateTo("Profile")}
            aria-label="Open profile page"
          >
            <div className="user-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="user-profile-info">
              <strong>{user?.name || "User"}</strong>
              <p>Personal account</p>
            </div>
          </button>

          <p>Your health, your records.</p>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="sweety-main">
        <header className="sweety-topbar">
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={
              sidebarOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={sidebarOpen}
            aria-controls="sweety-sidebar"
          >
            ☰
          </button>

          <div className="topbar-title">
            <p className="topbar-caption">BLOOD GLUCOSE TRACKER</p>
            <h1>{activeMenu}</h1>
          </div>

          <button
            type="button"
            className="user-profile topbar-profile"
            onClick={() => navigateTo("Profile")}
            aria-label="Open profile page"
          >
            <div className="user-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="user-profile-info">
              <strong>{user?.name || "User"}</strong>
              <p>Personal account</p>
            </div>
          </button>
        </header>

        <section className="sweety-content">
          {activeMenu === "Dashboard" && (
            <>
              <div className="welcome-banner">
                <div>
                  <h2>Welcome back, {user?.name || "User"}!</h2>
                  <p>
                    Keep track of your daily glucose readings in one place.
                  </p>
                </div>
                <span className="welcome-symbol">♥</span>
              </div>

              <GlucoseChart refreshKey={refreshKey} />

              <div className="overview-heading">
                <h2>Your Overview</h2>
                <p>Manage your glucose records</p>
              </div>

              <GlucoseSummary refreshKey={refreshKey} />

              <div className="overview-grid">
                <button
                  type="button"
                  className="overview-card"
                  onClick={() => navigateTo("Add Reading")}
                >
                  <span className="overview-icon">＋</span>
                  <h3>Add Reading</h3>
                  <p>Record a new glucose measurement.</p>
                  <span className="card-link">Add now →</span>
                </button>

                <button
                  type="button"
                  className="overview-card"
                  onClick={() => navigateTo("Reading History")}
                >
                  <span className="overview-icon">▤</span>
                  <h3>Reading History</h3>
                  <p>View and manage your saved readings.</p>
                  <span className="card-link">View history →</span>
                </button>

                <button
                  type="button"
                  className="overview-card"
                  onClick={() => navigateTo("Reports")}
                >
                  <span className="overview-icon">▥</span>
                  <h3>Reports</h3>
                  <p>Review daily and monthly statistics.</p>
                  <span className="card-link">View reports →</span>
                </button>
              </div>
            </>
          )}

          {activeMenu === "Add Reading" && (
            <div className="content-card">
              <ReadingForm onSaved={refreshReadings} />
            </div>
          )}

          {activeMenu === "Reading History" && (
            <div className="content-card">
              <ReadingList refreshKey={refreshKey} />
            </div>
          )}

          {activeMenu === "Reports" && (
            <div className="content-card">
              <ReportCards refreshKey={refreshKey} />
            </div>
          )}

          {activeMenu === "Profile" && (
            <div className="content-card">
              <Profile />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
