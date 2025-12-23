import React, { Component } from "react";
import { callApi, getSession, setSession } from "./api";
import MenuBar from "./MenuBar";

// Admin
import Dashboarda from "./Dashboarda";
import Complaintsa from "./Complaintsa";
import Users from "./Users";
import Settings from "./Settings";

// Officer
import Dashboardo from "./Dashboardo";
import Complaintso from "./Complaintso";
import Profileo from "./Profileo";

// User
import Dashboardu from "./Dashboardu";
import SubmitComplaints from "./SubmitComplaints";
import MyComplaints from "./MyComplaints";
import Profileu from "./Profileu";

// Higher Authority
import Dashboardh from "./Dashboardh";
import EscalationComplaints from "./EscalationComplaints";
import Profileh from "./Profileh";

// Admin Escalations
import EscalationsPage from "./EscalationsPage";

/* ================= UI STYLES (RESTORED 🔥) ================= */
const dashboardStyles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  font-family: 'Poppins', sans-serif;
}

.dashboard {
  display: grid;
  grid-template-rows: 64px auto 90px;
  height: 100vh;
  background: #f3f6fc;
}

/* HEADER */
.header {
  background: linear-gradient(135deg, #312e81, #4f46e5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: white;
}

.logoText {
  font-weight: 700;
  font-size: 1.3rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 18px;
}

.logout-btn {
  cursor: pointer;
  background: rgba(255,255,255,0.2);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.4);
}

/* CONTENT */
.outlet {
  padding: 20px;
  overflow-y: auto;
}

/* MENU */
.menu {
  display: flex;
  justify-content: center;
}
`;

class Dashboard extends Component {
  state = {
    fullname: "",
    activeComponent: null,
  };

  componentDidMount() {
    const csrid = getSession("csrid");
    if (!csrid) {
      this.logout();
      return;
    }

    callApi(
      "POST",
      "http://localhost:8910/users/getfullname",
      JSON.stringify({ csrid }),
      (res) => this.setState({ fullname: res })
    );
  }

  logout = () => {
    setSession("csrid", "", -1);
    window.location.replace("/");
  };

  loadComponents = (mid) => {
    console.log("🔥 MENU CLICKED → ID:", mid);
    this.setState({ activeComponent: String(mid) });
  };

  renderComponent = () => {
    const { activeComponent } = this.state;
    
    const componentMap = {
      // Admin menus
      "1": <Dashboarda />,           // Dashboard
      "2": <Complaintsa />,          // Complaints
      "3": <Users />,                // Users
      "4": <Settings />,             // Settings
      "12": <EscalationsPage />,     // Escalated Complaints (Admin Portal)

      // Officer menus
      "5": <Dashboardo />,
      "6": <Complaintso />,
      "7": <Profileo />,

      // User menus
      "8": <Dashboardu />,
      "9": <SubmitComplaints />,
      "10": <MyComplaints />,
      "11": <Profileu />,

      // Higher Authority menus
      "20": <Dashboardh />,
      "21": <EscalationComplaints />,  // Escalation Complaints (Higher Authority Portal)
      "22": <Profileh />,
    };

    return componentMap[activeComponent] || null;
  };

  render() {
    const { fullname, activeComponent } = this.state;

    return (
      <>
        <style>{dashboardStyles}</style>

        <div className="dashboard">
          {/* HEADER */}
          <div className="header">
            <div className="header-left">
              {/* Logo restored to original as requested */}
              <img src="./logo.jpeg" className="logo" alt="logo" />
              <span className="logoText">Grievance Portal</span>
            </div>

            <div className="header-right">
              <span>Hello, {fullname || "User"}</span>
              
              {/* EDITED: Replaced symbol with Power Icon SVG to match your pic */}
              <div className="logout-btn" onClick={this.logout} title="Logout">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>

            </div>
          </div>

          {/* CONTENT */}
          <div className="outlet">
            {this.renderComponent() || (
              <div style={{ textAlign: "center", marginTop: 50, color: "#64748b" }}>
                Select a menu option 👇
              </div>
            )}
          </div>

          {/* MENU */}
          <div className="menu">
            <MenuBar onMenuClick={this.loadComponents} />
          </div>
        </div>
      </>
    );
  }
}

export default Dashboard;