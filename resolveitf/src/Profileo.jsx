import React, { Component } from "react";
import "./Profileo.css";
import { motion, AnimatePresence } from "framer-motion";
import { callApi, getSession } from "./api";

export default class OfficerProfile extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: "details",
      user: null,
      availabilityStatus: "ACTIVE", // ACTIVE | ON_LEAVE
      editMode: false,
      phone: "",
      address: "",
      photoFile: null,
      selectedTheme: "Default",
      notifications: {
        email: true,
        sms: false,
        escalation: true
      },
      passwords: {
        current: "",
        new: "",
        confirm: ""
      }
    };

    this.handleProfileResponse = this.handleProfileResponse.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.toggleNotification = this.toggleNotification.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
  }

  componentDidMount() {
    let token = getSession("csrid");
    if (!token) return;

    let data = JSON.stringify({ csrid: token });
    callApi("POST", "http://localhost:8910/users/profile", data, this.handleProfileResponse);

    const savedTheme = localStorage.getItem("officerTheme");
    if (savedTheme) {
      this.setState({ selectedTheme: savedTheme });
    }
  }

  handleProfileResponse(res) {
    try {
      const user = JSON.parse(res);
      this.setState({
        user,
        phone: user.phone || "",
        address: user.address || "",
        availabilityStatus: (user.availabilityStatus || "ACTIVE").toUpperCase()
      });
    } catch (e) {
      console.error("Failed to load profile");
    }
  }

  saveProfile() {
    let token = getSession("csrid");
    let photoName = this.state.photoFile
      ? Date.now() + "_" + this.state.photoFile.name
      : this.state.user.photo || "";

    if (this.state.photoFile) {
      const reader = new FileReader();
      reader.onload = () => localStorage.setItem(photoName, reader.result);
      reader.readAsDataURL(this.state.photoFile);
    }

    let data = JSON.stringify({
      csrid: token,
      phone: this.state.phone,
      address: this.state.address,
      photo: photoName
    });

    callApi("POST", "http://localhost:8910/users/updateprofile", data, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        let updated = {
          ...this.state.user,
          phone: this.state.phone,
          address: this.state.address,
          photo: photoName
        };
        this.setState({ user: updated, editMode: false });
        alert("Profile Updated Successfully");
      } else {
        alert(r[1]);
      }
    });
  }

  toggleStatus() {
    const token = getSession("csrid");
    const nextStatus = this.state.availabilityStatus === "ACTIVE" ? "ON_LEAVE" : "ACTIVE";

    callApi(
      "POST",
      "http://localhost:8910/users/availability/self",
      JSON.stringify({ csrid: token, status: nextStatus }),
      (res) => {
        const [code, message] = res.split("::");
        if (code === "200") {
          this.setState((prev) => ({
            availabilityStatus: nextStatus,
            user: { ...prev.user, availabilityStatus: nextStatus }
          }));
        } else {
          alert(message || res);
        }
      }
    );
  }

  handleThemeChange(theme) {
    this.setState({ selectedTheme: theme });
    localStorage.setItem("officerTheme", theme);
  }

  toggleNotification(type) {
    this.setState((prev) => ({
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  }

  updatePassword() {
    const token = getSession("csrid");
    const { current, new: newpass, confirm } = this.state.passwords;

    if (current.trim() === "") return alert("Enter current password");
    if (newpass.trim() === "") return alert("Enter new password");
    if (newpass !== confirm) return alert("New passwords do not match");

    let body = JSON.stringify({
      csrid: token,
      current: current,
      new: newpass
    });

    callApi("POST", "http://localhost:8910/users/changepassword", body, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        alert("Password updated successfully");
        this.setState({
          passwords: { current: "", new: "", confirm: "" }
        });
      } else {
        alert(r[1]);
      }
    });
  }

  render() {
    const {
      activeTab,
      user,
      editMode,
      phone,
      address,
      availabilityStatus,
      selectedTheme,
      notifications,
      passwords
    } = this.state;

    const isActive = availabilityStatus === "ACTIVE";
    const statusLabel = isActive ? "Active" : "On Leave";

    if (!user)
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="loading-state"
        >
          Loading Officer Profile...
        </motion.div>
      );

    let photoUrl = user.photo
      ? localStorage.getItem(user.photo) ||
        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

    const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0 }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="profile-wrapper"
      >
        {/* LEFT SIDEBAR */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="profile-sidebar"
        >
          <motion.div className="sidebar-card" whileHover={{ scale: 1.02 }}>
            <motion.div className="avatar-container">
              <motion.img
                src={photoUrl}
                alt="Officer"
                className="sidebar-avatar"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />

              {/* BEAUTIFUL CAMERA ICON BUTTON - EXACTLY LIKE YOUR IMAGE */}
              <motion.label
                htmlFor="photo-upload"
                className="btn-camera-icon"
                whileHover={{ scale: 1.25, rotate: 20 }}
                whileTap={{ scale: 0.9 }}
                title="Change Profile Photo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </motion.label>

              {/* Hidden file input */}
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    this.setState({ photoFile: e.target.files[0] });
                    // Optional: Auto-enable edit mode
                    this.setState({ editMode: true });
                  }
                }}
              />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="sidebar-name"
            >
              {user.fullname}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="sidebar-role"
            >
              {user.department}
            </motion.p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`status-badge ${isActive ? "status-green" : "status-red"}`}
            >
              ● {statusLabel}
            </motion.div>

            <motion.div className="sidebar-actions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-toggle-status"
                onClick={this.toggleStatus}
              >
                {isActive ? "Mark On Leave" : "Mark Active"}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.aside>

        {/* MAIN CONTENT */}
        <motion.main
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="profile-main"
        >
          <div className="tabs-header">
            {["details", "theme", "notifications", "security"].map((tab) => (
              <motion.button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => this.setState({ activeTab: tab })}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab === "details" && "Personal Details"}
                {tab === "theme" && "Portal Theme"}
                {tab === "notifications" && "Notifications"}
                {tab === "security" && "Account Security"}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="tab-content-area"
            >
              {/* PERSONAL DETAILS */}
              {activeTab === "details" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <motion.div className="header-row">
                    <h3>Contact Information</h3>
                    {!editMode && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-edit-main"
                        onClick={() => this.setState({ editMode: true })}
                      >
                        Edit Details
                      </motion.button>
                    )}
                  </motion.div>

                  <motion.div className="form-grid">
                    {[
                      { label: "Full Name", value: user.fullname, locked: true },
                      { label: "Email", value: user.email, locked: true },
                      { label: "Phone", value: editMode ? phone : user.phone || "Not Set", editable: editMode },
                      { label: "Office Address", value: editMode ? address : user.address || "Not Set", editable: editMode }
                    ].map((field, i) => (
                      <motion.div key={i} variants={itemVariants} className="form-group">
                        <label>{field.label}</label>
                        <input
                          disabled={!field.editable}
                          value={field.editable ? (field.label === "Phone" ? phone : address) : field.value}
                          onChange={(e) => field.label === "Phone" ? this.setState({ phone: e.target.value }) : this.setState({ address: e.target.value })}
                          className={`inp-field ${field.locked ? "locked" : "editable"}`}
                        />
                      </motion.div>
                    ))}

                    {editMode && (
                      <motion.div variants={itemVariants} className="form-group full-width">
                        <label>Update Photo</label>
                        <input
                          type="file"
                          className="inp-file"
                          onChange={(e) => this.setState({ photoFile: e.target.files[0] })}
                        />
                      </motion.div>
                    )}
                  </motion.div>

                  {editMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="action-row"
                    >
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-cancel" onClick={() => this.setState({ editMode: false })}>
                        Cancel
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-save" onClick={this.saveProfile}>
                        Save Changes
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* THEME TAB */}
              {activeTab === "theme" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <motion.h3 variants={itemVariants}>Portal Theme</motion.h3>
                  <motion.p variants={itemVariants} className="sub-text">Choose your preferred theme.</motion.p>

                  <div className="theme-options-grid">
                    {["Default", "Aqua Blue", "Sunset", "Dark Mode"].map((theme, i) => (
                      <motion.button
                        key={theme}
                        variants={itemVariants}
                        whileHover={{ scale: 1.08, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className={`theme-option-btn ${selectedTheme === theme ? "active" : ""}`}
                        onClick={() => this.handleThemeChange(theme)}
                      >
                        <div className={`theme-preview theme-${theme.replace(" ", "").toLowerCase()}`} />
                        <span>{theme}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <motion.h3 variants={itemVariants}>Notification Preferences</motion.h3>
                  <motion.p variants={itemVariants} className="sub-text">Manage alert settings.</motion.p>

                  <div className="notification-settings">
                    {["email", "sms", "escalation"].map((type, i) => (
                      <motion.div key={type} variants={itemVariants} className="notif-toggle-row">
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
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <motion.h3 variants={itemVariants}>Change Password</motion.h3>
                  <motion.p variants={itemVariants} className="sub-text">Secure your account.</motion.p>

                  <div className="security-grid">
                    <motion.div variants={itemVariants} className="form-group full-width">
                      <label>Current Password</label>
                      <input
                        type="password"
                        className="inp-field editable"
                        value={passwords.current}
                        onChange={(e) => this.setState({ passwords: { ...passwords, current: e.target.value } })}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        className="inp-field editable"
                        value={passwords.new}
                        onChange={(e) => this.setState({ passwords: { ...passwords, new: e.target.value } })}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        className="inp-field editable"
                        value={passwords.confirm}
                        onChange={(e) => this.setState({ passwords: { ...passwords, confirm: e.target.value } })}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="action-row">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-save"
                        onClick={this.updatePassword}
                      >
                        Update Password
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </motion.div>
    );
  }
}