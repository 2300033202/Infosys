import React, { Component } from "react";
import { callApi, getSession } from "./api";
import "./Settings.css";

export default class Settings extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: "system",
      departments: [],
      officers: [],
      newDept: "",
      escalationHours: { high: 6, medium: 25, low: 50 },
      selectedTheme: "Default",
      adminEmail: "admin@resolveit.com",
      notifFreq: "Daily",
      notifications: { email: true, sms: false, escalation: true },
      passwords: { current: "", new: "", confirm: "" }
    };

    this.loadDepartments = this.loadDepartments.bind(this);
    this.loadOfficers = this.loadOfficers.bind(this);
    this.addDepartment = this.addDepartment.bind(this);
    this.deleteDepartment = this.deleteDepartment.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.handleEscChange = this.handleEscChange.bind(this);
    this.toggleNotification = this.toggleNotification.bind(this);
  }

  componentDidMount() {
    this.loadDepartments();
    this.loadOfficers();
    this.loadEscalationHours();
  }

  handleTabChange(tab) {
    this.setState({ activeTab: tab });
  }

  // --- API CALLS REMAIN THE SAME ---
  loadDepartments() {
    callApi("GET", "http://localhost:8910/departments/all", "", (res) => {
      try {
        const arr = typeof res === "string" ? JSON.parse(res) : res;
        this.setState({ departments: arr });
      } catch (e) { console.log(e); }
    });
  }

  loadOfficers() {
    callApi("GET", "http://localhost:8910/users/all", "", (res) => {
      try {
        const arr = typeof res === "string" ? JSON.parse(res) : res;
        const officers = arr.filter((u) => u.role === 2);
        this.setState({ officers });
      } catch (e) { console.log(e); }
    });
  }

  // Load priority-specific auto-escalation hours from backend
  loadEscalationHours() {
    callApi("GET", "http://localhost:8910/settings/escalation-hours", "", (res) => {
      try {
        const obj = typeof res === "string" ? JSON.parse(res) : res;
        if (obj && (obj.high || obj.medium || obj.low)) {
          this.setState({ escalationHours: {
            high: Number(obj.high ?? 6),
            medium: Number(obj.medium ?? 25),
            low: Number(obj.low ?? 50)
          }});
        }
      } catch (e) { /* ignore */ }
    });
  }

  // Handle input changes locally
  handleEscChange(field, value) {
    const v = Math.max(1, Number(value || 0));
    this.setState(prev => ({ escalationHours: { ...prev.escalationHours, [field]: v } }));
  }

  // Persist auto-escalation settings when any input loses focus
  saveEscalationHours = () => {
    const { escalationHours } = this.state;
    const body = JSON.stringify({
      high: Math.max(1, Number(escalationHours.high)),
      medium: Math.max(1, Number(escalationHours.medium)),
      low: Math.max(1, Number(escalationHours.low))
    });
    callApi("POST", "http://localhost:8910/settings/escalation-hours", body, (res) => {
      const r = typeof res === 'string' ? res.split("::") : ["200"]; 
      if (r[0] !== "200") alert(r[1] || "Failed to save escalation hours");
    });
  }

  toggleNotification(type) {
    this.setState((prev) => ({
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  }

  addDepartment() {
    if (this.state.newDept.trim() === "") return alert("Enter category name");
    let data = JSON.stringify({ name: this.state.newDept.trim() });
    callApi("POST", "http://localhost:8910/departments/add", data, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        this.setState({ newDept: "" });
        this.loadDepartments();
      } else {
        alert(r[1]);
      }
    });
  }

  deleteDepartment(id) {
    if (!window.confirm("Are you sure? This action is permanent.")) return;
    let data = JSON.stringify({ id: id });
    callApi("POST", "http://localhost:8910/departments/delete", data, (res) => {
      this.loadDepartments();
    });
  }

  updatePassword() {
    const { current, new: newpass, confirm } = this.state.passwords;
    if (current.trim() === "") return alert("Enter your current password");
    if (newpass.trim() === "") return alert("Enter new password");
    if (newpass !== confirm) return alert("New passwords do not match");
    const token = getSession("csrid");
    let body = JSON.stringify({ csrid: token, current: current, new: newpass });

    callApi("POST", "http://localhost:8910/users/changepassword", body, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        alert("Password updated successfully!");
        this.setState({ passwords: { current: "", new: "", confirm: "" } });
      } else {
        alert(r[1]);
      }
    });
  }

  // --- RENDERS ---

  renderSystem() {
    const { escalationHours, newDept, departments, officers } = this.state;
    return (
      <div className="tab-content-anim">
        {/* Auto Escalation (Hours per Priority) */}
        <div className="settings-section">
          <label className="section-label">Auto-Escalation Thresholds (hours)</label>
          <div className="input-group" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px'}}>
            <div>
              <label className="section-label" style={{fontSize:'12px'}}>High</label>
              <input
                type="number"
                className="settings-input"
                min={1}
                value={escalationHours.high}
                onChange={(e) => this.handleEscChange('high', e.target.value)}
                onBlur={this.saveEscalationHours}
              />
            </div>
            <div>
              <label className="section-label" style={{fontSize:'12px'}}>Medium</label>
              <input
                type="number"
                className="settings-input"
                min={1}
                value={escalationHours.medium}
                onChange={(e) => this.handleEscChange('medium', e.target.value)}
                onBlur={this.saveEscalationHours}
              />
            </div>
            <div>
              <label className="section-label" style={{fontSize:'12px'}}>Low</label>
              <input
                type="number"
                className="settings-input"
                min={1}
                value={escalationHours.low}
                onChange={(e) => this.handleEscChange('low', e.target.value)}
                onBlur={this.saveEscalationHours}
              />
            </div>
          </div>
          <span className="input-hint">Complaints auto-escalate after these many hours since start.</span>
        </div>

        {/* Departments */}
        <div className="settings-section">
          <label className="section-label">Categories (Departments)</label>
          <div className="add-row">
            <input
              type="text"
              className="settings-input"
              placeholder="Add new category..."
              value={newDept}
              onChange={(e) => this.setState({ newDept: e.target.value })}
            />
            <button className="btn-primary-add" onClick={this.addDepartment}>
              + Add
            </button>
          </div>

          <div className="tags-container">
            {departments.map(d => (
              <div key={d.id} className="dept-tag">
                <span className="tag-text">{d.name}</span>
                <button
                  className="tag-delete-btn"
                  onClick={() => this.deleteDepartment(d.id)}
                  title="Delete Category"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Officers */}
        <div className="settings-section">
          <label className="section-label">Officers</label>
          <div className="officers-mini-list">
            {officers.map((o, i) => (
              <div key={i} className="officer-row">
                <div className="officer-avatar">{o.fullname ? o.fullname[0] : "O"}</div>
                <div className="officer-info">
                  <span className="officer-name">{o.fullname}</span>
                  <span className="officer-dept">{o.department}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderNotifications() {
    const { adminEmail, notifFreq, notifications } = this.state;
    return (
      <div className="tab-content-anim">
        <div className="notif-card">
          <h3 className="card-heading">Notification Preferences</h3>
          <p className="sub-text">Manage alert settings.</p>
          <div className="notification-settings">
            {["email", "sms", "escalation"].map((type) => (
              <div key={type} className="notif-toggle-row">
                <div className="notif-info">
                  <span className="notif-title">
                    {type === "email" && "Email Alerts"}
                    {type === "sms" && "SMS Notifications"}
                    {type === "escalation" && "Escalation Warnings"}
                  </span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications[type]}
                    onChange={() => this.toggleNotification(type)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            ))}
          </div>

          <div className="settings-section" style={{ marginTop: "24px" }}>
            <label className="section-label">Admin Email</label>
            <input
              type="email"
              className="settings-input"
              value={adminEmail}
              onChange={(e) => this.setState({ adminEmail: e.target.value })}
            />
          </div>
          <div className="settings-section" style={{ marginTop: "8px" }}>
            <label className="section-label">Frequency</label>
            <select
              className="settings-select"
              value={notifFreq}
              onChange={(e) => this.setState({ notifFreq: e.target.value })}
            >
              <option>Instant</option>
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  renderAccount() {
    const { passwords } = this.state;
    return (
      <div className="tab-content-anim">
        <div className="account-card">
          <div className="account-header" style={{display:'flex', alignItems:'center', marginBottom: '20px'}}>
            <div className="admin-avatar-lg">A</div>
            <div>
              <h3 style={{margin:0}}>Admin Account</h3>
              <span style={{color:'#888', fontSize:'13px'}}>Manage your credentials</span>
            </div>
          </div>
          <hr className="card-divider" style={{border:'0', borderTop:'1px solid #eee', marginBottom:'20px'}} />

          <div className="settings-section">
            <label className="section-label">Change Password</label>
            <div className="password-grid">
              <input
                type="password"
                className="settings-input"
                placeholder="Current Password"
                value={passwords.current}
                onChange={(e) => this.setState({ passwords: { ...passwords, current: e.target.value } })}
              />
              <input
                type="password"
                className="settings-input"
                placeholder="New Password"
                value={passwords.new}
                onChange={(e) => this.setState({ passwords: { ...passwords, new: e.target.value } })}
              />
              <input
                type="password"
                className="settings-input"
                placeholder="Confirm Password"
                value={passwords.confirm}
                onChange={(e) => this.setState({ passwords: { ...passwords, confirm: e.target.value } })}
              />
            </div>
          </div>
          <div className="actions-right">
            <button className="btn-primary" onClick={this.updatePassword}>
              Update Password
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { activeTab } = this.state;

    return (
      <div className="settings-container">
        <h1 className="settings-title">Admin Settings</h1>
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => this.handleTabChange("system")}
          >
            System
          </button>
          <button
            className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => this.handleTabChange("notifications")}
          >
            Notifications
          </button>
          <button
            className={`tab-btn ${activeTab === "account" ? "active" : ""}`}
            onClick={() => this.handleTabChange("account")}
          >
            Account
          </button>
        </div>

        {/* KEY CONCEPT: Adding key={activeTab} forces React to tear down 
           and recreate this div when the tab changes. 
           This triggers the CSS animations inside every time!
        */}
        <div className="settings-content-wrapper" key={activeTab}>
          {activeTab === "system" && this.renderSystem()}
          {activeTab === "notifications" && this.renderNotifications()}
          {activeTab === "account" && this.renderAccount()}
        </div>
      </div>
    );
  }
}