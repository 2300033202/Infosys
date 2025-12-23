import React, { Component } from "react";
import "./App.css";
import { callApi, setSession } from "./api"; 

// --- SVG Icons ---
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const EyeIcon = ({ show }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{cursor:'pointer'}}>
    {show ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
    )}
  </svg>
);

class App extends Component {
  constructor() {
    super();
    this.state = {
      tempUser: { fullname: "", email: "", role: "", password: "", department: "" },
      confirmPassword: "",
      loginEmail: "",
      loginPassword: "",
      otpValue: "",
      otpEmail: "",
      departments: [],
      selectedDept: "",
      
      // UI State
      isPopupOpen: false,
      activeView: "signin", 
      showPassword: false,
      isLoading: false,
      errorMsg: ""
    };
  }

  componentDidMount() {
    this.loadDepartments();
  }

  loadDepartments = () => {
    callApi("GET", "http://localhost:8910/departments/all", "", (res) => {
      try {
        const arr = typeof res === "string" ? JSON.parse(res) : res;
        this.setState({ departments: arr });
      } catch (e) {
        console.warn("Failed to parse departments:", e);
      }
    });
  };

  // --- UI Handlers ---
  openPopup = (view = "signin") => {
    this.setState({ isPopupOpen: true, activeView: view, errorMsg: "" });
  };

  closePopup = (e) => {
    if (!e || e.target.id === "popupBackdrop" || e.target.id === "closeBtn") {
      this.setState({ isPopupOpen: false });
    }
  };

  switchView = (view) => {
    this.setState({ activeView: view, errorMsg: "" });
  };

  togglePassword = () => {
    this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
  };

  handleInputChange = (e, field, parent = null) => {
    if (parent === "tempUser") {
      this.setState({
        tempUser: { ...this.state.tempUser, [field]: e.target.value }
      });
    } else {
      this.setState({ [field]: e.target.value });
    }
  };

  setError = (msg) => {
    this.setState({ errorMsg: msg });
    setTimeout(() => this.setState({ errorMsg: "" }), 3000);
  };

  // --- Logic Handlers ---
  validateSignup = () => {
    const { tempUser, confirmPassword, selectedDept } = this.state;
    if (!tempUser.fullname || !tempUser.email || !tempUser.role || !tempUser.password) {
      this.setError("All fields are required.");
      return false;
    }
    if (tempUser.password !== confirmPassword) {
      this.setError("Passwords do not match.");
      return false;
    }
    if (parseInt(tempUser.role) === 2 && !selectedDept) {
      this.setError("Please select a department.");
      return false;
    }
    return true;
  };

  userRegistration = () => {
    if (!this.validateSignup()) return;
    const { tempUser, selectedDept } = this.state;
    this.setState({ isLoading: true });

    const userPayload = { 
        ...tempUser, 
        role: parseInt(tempUser.role),
        department: parseInt(tempUser.role) === 2 ? selectedDept : "All" 
    };

    this.setState({ tempUser: userPayload, otpEmail: tempUser.email }, () => {
        this.requestOtp(tempUser.email);
    });
  };

  requestOtp = (email) => {
    const data = JSON.stringify({ email });
    callApi("POST", "http://localhost:8910/users/requestOtp", data, (res) => {
        this.setState({ isLoading: false });
        let r = res.split("::");
        if (r[0] === "200") {
             this.switchView("otp");
        } else {
             this.setError("Failed to send OTP: " + r[1]);
        }
    });
  };

  verifyOtp = () => {
    if (this.state.otpValue.trim() === "") {
        this.setError("Please enter OTP");
        return;
    }
    const data = JSON.stringify({ email: this.state.otpEmail, otp: this.state.otpValue });
    callApi("POST", "http://localhost:8910/users/verifyOtp", data, (res) => {
        let r = res.split("::");
        if (r[0] === "200") {
            this.finalSignup();
        } else {
            this.setError("Invalid OTP");
        }
    });
  };

  finalSignup = () => {
    let user = this.state.tempUser;
    if (user.email) user.email = user.email.trim().toLowerCase();
    let data = JSON.stringify(user);
    callApi("POST", "http://localhost:8910/users/signup", data, (res) => {
      let r = res.split("::");
      if (r[0] === "200") {
        alert("Account Created Successfully!");
        this.switchView("signin");
      } else {
        this.setError(r[1]);
      }
    });
  };

  signin = () => {
    const { loginEmail, loginPassword } = this.state;
    if (!loginEmail || !loginPassword) {
        this.setError("Enter username & password");
        return;
    }
    let data = JSON.stringify({ email: loginEmail, password: loginPassword });
    callApi("POST", "http://localhost:8910/users/signin", data, (res) => {
        let r = res.split("::");
        if (r[0] === "200") {
            setSession("csrid", r[1], 1);
            setSession("role", r[2], 1);
            window.location.replace("/dashboard");
        } else {
            this.setError(r[1]);
        }
    });
  };

  forgetpassword = () => {
      if(!this.state.loginEmail) {
          this.setError("Please enter your email/username first");
          return;
      }
      let url = "http://localhost:8910/users/forgetpassword/" + this.state.loginEmail;
      callApi("GET", url, "", (res) => alert(res));
  }

  render() {
    const { departments, isPopupOpen, activeView, showPassword, errorMsg, tempUser, selectedDept } = this.state;
    
    return (
      <div id="container">
        
        {/* ANIMATED BACKGROUND (Smoother, Slower) */}
        <ul className="circles">
            <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
        </ul>

        {/* NAVBAR (Landing Page) */}
        <nav id="navbar">
          <div className="nav-brand">
            <img className="logo" src="/logo.jpeg" alt="Logo" />
            <span>GrievancePortal</span>
          </div>
          <button className="nav-signin-btn" onClick={() => this.openPopup('signin')}>
            Sign In
          </button>
        </nav>

        {/* HERO CONTENT */}
        <div id="hero-content">
            <div className="hero-text">
                <h1>We are here to help.</h1>
                <p>Resolve your grievances quickly, efficiently, and transparently.</p>
                <button className="cta-btn" onClick={() => this.openPopup('signup')}>Get Started</button>
            </div>
            <div className="hero-image">
                 <img src="/dp.jpeg" alt="Portal Visual" />
            </div>
        </div>

        {/* POPUP MODAL */}
        {isPopupOpen && (
          <div id="popupBackdrop" onClick={this.closePopup}>
            <div className={`popup-window ${activeView}`}>
              <button id="closeBtn" onClick={() => this.closePopup({target: {id: 'closeBtn'}})}>
                <CloseIcon />
              </button>
              
              <div className="popup-header">
                <h2>
                    {activeView === 'signin' && "Welcome Back"}
                    {activeView === 'signup' && "Create Account"}
                    {activeView === 'otp' && "Verification"}
                </h2>
              </div>

              <div className="popup-body">
                {errorMsg && <div className="error-banner">{errorMsg}</div>}

                {/* --- LOGIN FORM --- */}
                {activeView === 'signin' && (
                    <div className="form-group fade-in">
                        <div className="floating-label-group">
                            <input type="text" required onChange={(e) => this.handleInputChange(e, 'loginEmail')} />
                            <label>Username / Email</label>
                        </div>
                        <div className="floating-label-group">
                            <input type={showPassword ? "text" : "password"} required onChange={(e) => this.handleInputChange(e, 'loginPassword')} />
                            <label>Password</label>
                            <span className="eye-icon" onClick={this.togglePassword}><EyeIcon show={showPassword} /></span>
                        </div>
                        <div className="forgot-pass" onClick={this.forgetpassword}>Forgot Password?</div>
                        <button className="action-btn" onClick={this.signin}>Sign In</button>
                        <div className="switch-text">
                            New here? <span onClick={() => this.switchView('signup')}>Create an account</span>
                        </div>
                    </div>
                )}

                {/* --- SIGNUP FORM --- */}
                {activeView === 'signup' && (
                    <div className="form-group fade-in">
                        <div className="floating-label-group">
                            <input type="text" required value={tempUser.fullname} onChange={(e) => this.handleInputChange(e, 'fullname', 'tempUser')} />
                            <label>Full Name</label>
                        </div>
                        <div className="floating-label-group">
                            <input type="email" required value={tempUser.email} onChange={(e) => this.handleInputChange(e, 'email', 'tempUser')} />
                            <label>Email Address</label>
                        </div>
                        
                        <div className="floating-label-group">
                            <select required value={tempUser.role} onChange={(e) => this.handleInputChange(e, 'role', 'tempUser')}>
                                <option value="" disabled></option>
                                <option value="1">Admin</option>
                                <option value="2">Officer</option>
                                <option value="3">User</option>
                                <option value="4">Higher Authority</option>

                            </select>
                            <label className="select-label">Select Role</label>
                        </div>
                        
                        {parseInt(tempUser.role) === 2 && (
                            <div className="floating-label-group slide-down">
                                <select required value={selectedDept} onChange={(e) => this.handleInputChange(e, 'selectedDept')}>
                                    <option value="" disabled></option>
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                                <label className="select-label">Department</label>
                            </div>
                        )}

                        <div className="floating-label-group">
                            <input type="password" required onChange={(e) => this.handleInputChange(e, 'password', 'tempUser')} />
                            <label>Password</label>
                        </div>
                        <div className="floating-label-group">
                            <input type="password" required onChange={(e) => this.handleInputChange(e, 'confirmPassword')} />
                            <label>Confirm Password</label>
                        </div>

                        <button className="action-btn" onClick={this.userRegistration}>Register</button>
                        <div className="switch-text">
                            Already have an account? <span onClick={() => this.switchView('signin')}>Sign In</span>
                        </div>
                    </div>
                )}

                {/* --- OTP FORM --- */}
                {activeView === 'otp' && (
                    <div className="form-group fade-in">
                        <div className="floating-label-group">
                            <input type="text" required className="otp-input" onChange={(e) => this.handleInputChange(e, 'otpValue')} />
                            <label>Enter 6-digit OTP</label>
                        </div>
                        <button className="action-btn" onClick={this.verifyOtp}>Verify Code</button>
                        <div className="switch-text">
                            <span onClick={() => this.switchView('signup')}>Back to Signup</span>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;