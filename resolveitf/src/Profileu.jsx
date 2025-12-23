import React, { Component } from "react";
import "./Profileu.css";
// RESTORED: Importing your actual API helper
import { callApi, getSession } from "./api"; 

import {
  FaEdit, FaCheckCircle, FaBell, FaPalette, FaDownload,
  FaQuestionCircle, FaVideo, FaRegFileAlt, FaPhoneAlt,
  FaCamera, FaTimes, FaLock, FaChevronRight, FaMoon, FaSun, FaMagic
} from "react-icons/fa";

// ================= SLIDE PANEL COMPONENT ==================
const SlideUpPanel = ({ open, onClose, title, children, theme }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [open]);

  return (
    <>
      <div className={`slide-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`slide-panel ${open ? "open" : ""} ${theme}`}>
        <div className="slide-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes size={16} />
          </button>
        </div>
        <div className="slide-content">{children}</div>
      </div>
    </>
  );
};

export default class Profileu extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: "info",
      user: null,
      theme: localStorage.getItem("theme") || "aurora",
      rating: 66,
      editMode: false,
      phone: "",
      address: "",
      photoFile: null,
      profilePicData: "",

      // Slide panels
      showComplaintGuide: false,
      showTutorial: false,
      showPDF: false,
      showOfficer: false,

      // Security
      security: {
        current: "",
        newpass: "",
        confirm: ""
      }
    };

    this.fileInputRef = React.createRef();
    this.handleProfileResponse = this.handleProfileResponse.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
  }

  componentDidMount() {
    this.applyTheme();

    // 1. Get Token
    let token = getSession("csrid");

    // 2. If no token, show dummy data (Fallback) or redirect
    if (!token) {
      this.setState({
        user: {
          fullname: "Guest User",
          email: "guest@example.com",
          phone: "0000000000",
          address: "Please Login",
          photo: null
        },
        phone: "",
        address: ""
      });
      return;
    }

    // 3. REAL BACKEND CALL (Restored)
    let data = JSON.stringify({ csrid: token });
    callApi("POST", "http://localhost:8910/users/profile", data, this.handleProfileResponse);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.rating !== this.state.rating) {
      document.documentElement.style.setProperty("--slider-fill", this.state.rating + "%");
    }
    if (prevState.theme !== this.state.theme) {
      this.applyTheme();
    }
  }

  applyTheme() {
    const body = document.body;
    if (!body) return;
    body.classList.remove("aurora-theme", "light-theme", "dark-theme");
    body.classList.add(`${this.state.theme}-theme`);
    localStorage.setItem("theme", this.state.theme);
  }

  changeTheme(newTheme) {
    this.setState({ theme: newTheme });
  }

  handleProfileResponse(res) {
    if (!res || !res.startsWith("{")) return;
    try {
      let user = JSON.parse(res);
      this.setState({
        user,
        phone: user.phone || "",
        address: user.address || ""
      });
    } catch {
      alert("Failed to load profile");
    }
  }

  saveProfile() {
    let token = getSession("csrid");
    let photoName = this.state.photoFile
      ? Date.now() + "_" + this.state.photoFile.name
      : (this.state.user.photo || "");

    // Handle File Reading locally for preview
    if (this.state.photoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem(photoName, reader.result);
        this.setState({ profilePicData: reader.result });
      };
      reader.readAsDataURL(this.state.photoFile);
    }

    let data = JSON.stringify({
      csrid: token,
      phone: this.state.phone,
      address: this.state.address,
      photo: photoName
    });

    // REAL BACKEND CALL
    callApi("POST", "http://localhost:8910/users/updateprofile", data, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        this.setState({ editMode: false });
        // Optimistically update UI
        this.setState(prevState => ({
            user: { ...prevState.user, phone: this.state.phone, address: this.state.address }
        }));
        alert("Profile Updated Successfully!");
      } else alert(r[1]);
    });
  }

  updatePassword() {
    const { current, newpass, confirm } = this.state.security;
    let token = getSession("csrid");

    if (!current || !newpass || !confirm) return alert("All fields are required.");
    if (newpass !== confirm) return alert("New passwords do not match.");

    let body = JSON.stringify({
      csrid: token,
      current: current,
      new: newpass
    });

    // REAL BACKEND CALL
    callApi("POST", "http://localhost:8910/users/changepassword", body, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        alert("Password updated successfully!");
        this.setState({ security: { current: "", newpass: "", confirm: "" } });
      } else {
        alert(r[1]);
      }
    });
  }

  handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    this.setState({ photoFile: file });

    const reader = new FileReader();
    reader.onloadend = () => this.setState({ profilePicData: reader.result });
    reader.readAsDataURL(file);
  };

  render() {
    const {
      activeTab, user, theme, rating, editMode, phone, address, profilePicData,
      showComplaintGuide, showTutorial, showPDF, showOfficer, security
    } = this.state;

    if (!user)
      return <div className="loading-screen fade-in">Loading Profile...</div>;

    // Use uploaded photo OR user photo from DB OR default
    let photoUrl = profilePicData || (user.photo && localStorage.getItem(user.photo)) || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

    // Google Drive Preview Link
    const videoEmbedUrl = "https://drive.google.com/file/d/1lDZkiL-L0sQ6F2p7WZQjzwY2E73sKP6_/preview";

    return (
      <div className="profile-container fade-in">

        {/* ================= TABS ================= */}
        <div className="profile-tabs">
          {[
            { id: "info", label: "Profile Info" },
            { id: "settings", label: "Settings" },
            { id: "security", label: "Security" },
            { id: "help", label: "Help Center" }
          ].map((t) => (
             <button
                key={t.id}
                className={activeTab === t.id ? "tab active" : "tab"}
                onClick={() => this.setState({ activeTab: t.id })}
             >
                {t.label}
             </button>
          ))}
        </div>

        {/* ================= INFO TAB ================= */}
        {activeTab === "info" && (
          <div className="profile-content slide-up">
            <div className="profile-card glass-effect">
              <div className="avatar-wrapper">
                <img src={photoUrl} alt="avatar" className="profile-avatar-img" />
                <button
                  onClick={() => this.fileInputRef.current.click()}
                  className="camera-btn"
                >
                  <FaCamera size={14} />
                </button>
                <input type="file" ref={this.fileInputRef} onChange={this.handlePhotoChange} accept="image/*" style={{ display: "none" }} />
              </div>
              <h3 className="username">{user.fullname}</h3>
              <span className="user-email-display">{user.email}</span>
            </div>

            <div className="glass-effect">
              {!editMode ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Phone Number</span>
                    <span className="info-value">{user.phone || "Not Set"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Address</span>
                    <span className="info-value">{user.address || "Not Set"}</span>
                  </div>
                  <button className="action-btn primary-gradient" onClick={() => this.setState({ editMode: true })}>
                    <FaEdit /> Edit Details
                  </button>
                </>
              ) : (
                <>
                  <label className="input-label">Phone Number</label>
                  <input className="profile-input" value={phone} onChange={(e) => this.setState({ phone: e.target.value })} />

                  <label className="input-label">Residential Address</label>
                  <input className="profile-input" value={address} onChange={(e) => this.setState({ address: e.target.value })} />

                  <div className="btn-group">
                    <button className="action-btn success-gradient" onClick={this.saveProfile}><FaCheckCircle /> Save</button>
                    <button className="action-btn danger-gradient" onClick={() => this.setState({ editMode: false })}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =============== SETTINGS TAB =============== */}
        {activeTab === "settings" && (
          <div className="profile-content slide-up">
            <div className="glass-effect flex-row-center">
              <h3 className="no-margin"><FaBell className="icon-mr"/> Notifications</h3>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="glass-effect">
              <h3><FaPalette className="icon-mr"/> Appearance</h3>
              <div className="theme-options">
                <button className={`theme-btn aurora ${theme === "aurora" ? "active" : ""}`} onClick={() => this.changeTheme("aurora")}>
                    <FaMagic/> Aurora
                </button>
                <button className={`theme-btn light ${theme === "light" ? "active" : ""}`} onClick={() => this.changeTheme("light")}>
                    <FaSun/> Day
                </button>
                <button className={`theme-btn dark ${theme === "dark" ? "active" : ""}`} onClick={() => this.changeTheme("dark")}>
                    <FaMoon/> Night
                </button>
              </div>
            </div>

            <div className="glass-effect">
              <h3>⭐ Feedback</h3>
              <p className="sub-text">Rate your experience with the portal.</p>
              <div className="slider-container">
                 <input type="range" className="rating-slider" min="0" max="100" value={rating} onChange={(e) => this.setState({ rating: e.target.value })} />
              </div>
              <p className="rating-text">{rating}% Satisfaction</p>
            </div>
          </div>
        )}

        {/* =============== SECURITY TAB =============== */}
        {activeTab === "security" && (
          <div className="profile-content slide-up">
            <div className="glass-effect">
              <h3><FaLock className="icon-mr"/> Change Password</h3>

              <label className="input-label">Current Password</label>
              <input type="password" class="profile-input" placeholder="••••••" value={security.current} onChange={(e) => this.setState({ security: { ...security, current: e.target.value } })} />

              <label className="input-label">New Password</label>
              <input type="password" class="profile-input" placeholder="••••••" value={security.newpass} onChange={(e) => this.setState({ security: { ...security, newpass: e.target.value } })} />

              <label className="input-label">Confirm Password</label>
              <input type="password" class="profile-input" placeholder="••••••" value={security.confirm} onChange={(e) => this.setState({ security: { ...security, confirm: e.target.value } })} />

              <button className="action-btn primary-gradient mt-20" onClick={this.updatePassword}>Update Password</button>
            </div>
          </div>
        )}

        {/* =============== HELP TAB =============== */}
        {activeTab === "help" && (
          <div className="profile-content slide-up">
            <div className="glass-effect">
              <h3><FaQuestionCircle className="icon-mr"/> Help Center</h3>
              <p className="sub-text mb-20">Guides, Tutorials, and Support Contact.</p>

              <ul className="help-list">
                <li onClick={() => this.setState({ showComplaintGuide: true })}>
                  <span className="help-item-text"><FaRegFileAlt size={18} className="icon-mr" /> Filing Guide</span>
                  <FaChevronRight size={14} color="#ccc" />
                </li>
                <li onClick={() => this.setState({ showTutorial: true })}>
                  <span className="help-item-text"><FaVideo size={18} className="icon-mr" /> Video Tutorial</span>
                  <FaChevronRight size={14} color="#ccc" />
                </li>
                <li onClick={() => this.setState({ showPDF: true })}>
                  <span className="help-item-text"><FaDownload size={18} className="icon-mr" /> Download Manual</span>
                  <FaChevronRight size={14} color="#ccc" />
                </li>
                <li onClick={() => this.setState({ showOfficer: true })}>
                  <span className="help-item-text"><FaPhoneAlt size={18} className="icon-mr" /> Contact Officer</span>
                  <FaChevronRight size={14} color="#ccc" />
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ================= SLIDE PANELS ================= */}
        <SlideUpPanel open={showComplaintGuide} onClose={() => this.setState({ showComplaintGuide: false })} title="Quick Guide" theme={theme}>
          <div className="guide-content">
              <div className="step"><span className="step-num">1</span> Go to Dashboard</div>
              <div className="step"><span className="step-num">2</span> Click 'Submit Complaint'</div>
              <div className="step"><span className="step-num">3</span> Select Category & Upload Photo</div>
              <div className="step"><span className="step-num">4</span> Submit & Track ID</div>
          </div>
        </SlideUpPanel>

        {/* === VIDEO TUTORIAL PANEL === */}
        <SlideUpPanel open={showTutorial} onClose={() => this.setState({ showTutorial: false })} title="Video Tutorial" theme={theme}>
          <div className="video-responsive-container">
            <iframe
                src={videoEmbedUrl}
                title="Video Tutorial Player"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
            ></iframe>
          </div>
        </SlideUpPanel>

        <SlideUpPanel open={showPDF} onClose={() => this.setState({ showPDF: false })} title="User Manual" theme={theme}>
          <div className="pdf-download-center">
              <div className="pdf-icon">📄</div>
              <h4>User_Manual_v2.pdf</h4>
              <button className="action-btn primary-gradient"><FaDownload className="icon-mr"/> Download Now</button>
          </div>
        </SlideUpPanel>

        <SlideUpPanel open={showOfficer} onClose={() => this.setState({ showOfficer: false })} title="Contact Officer" theme={theme}>
          <div className="officer-card">
            <h4>Rajesh Kumar</h4>
            <p className="role">Zonal Commissioner</p>
            <div className="contact-row"><span>📞</span> +91 98765 43210</div>
            <div className="contact-row"><span>📧</span> grievance@ward12.gov.in</div>
          </div>
        </SlideUpPanel>

      </div>
    );
  }
}