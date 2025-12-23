import React, { Component, createRef } from "react";
// ✅ RESTORED: Real API imports
import { getSession, callApi } from "./api"; 

import {
  FaRegImage,
  FaRegFileVideo,
  FaRegTrashAlt,
  FaCloudUploadAlt,
  FaRegFilePdf,
  FaRegFileAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

// Constants
const FALLBACK_CATEGORIES = [
  "Water Management",
  "Traffic Management",
  "Sanitation Management",
  "Education Management",
  "Municipals Management",
  "Public Infrastructure",
];
const PRIORITIES = ["Low", "Medium", "High"];
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
  "video/mp4",
  "video/x-msvideo",
  "video/quicktime",
  "video/x-matroska",
];
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

/* =========================================
   CSS STYLES (Blue/Indigo Theme)
   ========================================= */
const cssStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap');

  body { 
    margin: 0;
    background: #f3f6fc; 
    font-family: 'Inter', sans-serif;
    color: #1e293b;
  }

  /* Hide Scrollbars */
  body::-webkit-scrollbar, html::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes popInToast {
    0% { transform: translate(-50%, -20px); opacity: 0; }
    100% { transform: translate(-50%, 0); opacity: 1; }
  }

  /* ===== My Grievances Header Section ===== */
  .myG-wrapper {
    max-width: 900px;
    margin: 30px auto 10px auto;
    text-align: center;
    padding: 16px;
  }

  .myG-title {
    font-family: 'Poppins', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0 0 20px 0;
    color: #6366f1; /* Indigo */
    letter-spacing: -0.02em;
    text-shadow: 0px 2px 10px rgba(99, 102, 241, 0.1);
  }

  .myG-btn-row {
    display: inline-flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .myG-pill-btn {
    border-radius: 50px;
    border: 1.5px solid #6366f1;
    padding: 10px 24px;
    background: #ffffff;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
    transition: all 0.2s ease;
  }

  .myG-pill-btn:hover {
    background: #6366f1;
    color: #ffffff;
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);
  }

  /* ===== Main Card Container ===== */
  .complaint-page-wrapper {
    min-height: 100vh;
    padding: 10px 0 40px 0;
  }

  .complaintX-container {
    width: 100%;
    max-width: 700px;
    margin: 20px auto 50px auto;
    padding: 40px 45px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 20px 50px rgba(30, 41, 59, 0.08); 
    text-align: center;
    position: relative;
    box-sizing: border-box;
    animation: slideUpFade 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
    border-top: 6px solid #6366f1; /* Indigo Top Border */
  }

  .complaintX-title {
    font-family: 'Poppins', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  
  .complaintX-welcome {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 35px;
  }
  .complaintX-name { color: #6366f1; font-weight: 700; }

  /* ===== Toggle ===== */
  .typeX-toggle {
    display: flex;
    background: #f1f5f9;
    padding: 6px;
    border-radius: 14px;
    margin-bottom: 30px;
    gap: 10px;
  }
  .typeX-toggle button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    color: #64748b;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .typeX-toggle button.active {
    background: #ffffff;
    color: #4f46e5; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  /* ===== Form ===== */
  .formX { text-align: left; }
  
  .formX label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
    display: block;
    margin-top: 20px;
  }

  .formX input, .formX select, .formX textarea {
    width: 100%;
    padding: 14px 16px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    font-size: 0.95rem;
    color: #1e293b;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  
  .formX textarea { min-height: 120px; resize: none; }

  .formX input:focus, .formX select:focus, .formX textarea:focus {
    background: #ffffff;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  }

  /* ===== Priority Buttons ===== */
  .priorityX-btns { display: flex; gap: 12px; margin-top: 5px; }
  .priorityX-btns button {
    flex: 1;
    padding: 12px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
    color: #64748b;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Inter', sans-serif;
  }
  
  .priorityX-btns button:hover { background: #f8fafc; border-color: #cbd5e1; }
  
  .priorityX-btns button.pactive {
    border: 1.5px solid transparent;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .priorityX-btns button:nth-child(1).pactive { background: #10b981; } /* Low */
  .priorityX-btns button:nth-child(2).pactive { background: #f59e0b; } /* Med */
  .priorityX-btns button:nth-child(3).pactive { background: #ef4444; } /* High */

  /* ===== File Upload ===== */
  .fileX-box {
    border: 2px dashed #cbd5e1;
    background: #f8fafc;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-top: 10px;
    transition: all 0.2s;
  }
  .fileX-box:hover { border-color: #6366f1; background: #eef2ff; }

  .uploadX-btn {
    margin-top: 12px;
    background: #ffffff;
    color: #4f46e5;
    padding: 10px 24px;
    border-radius: 8px;
    border: 1.5px solid #4f46e5;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }
  .uploadX-btn:hover { 
    background: #4f46e5; 
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
  }

  /* ===== Submit Button ===== */
  .submitX-btn {
    width: 100%;
    margin-top: 35px;
    padding: 18px;
    border-radius: 14px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: white;
    font-size: 1.1rem;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    border: none;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
    transition: all 0.3s;
  }
  .submitX-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
  }
  .submitX-btn:active { transform: scale(0.98); }
  .submitX-btn:disabled { background: #94a3b8; cursor: not-allowed; }

  /* Toast */
  .custom-toast {
    position: fixed; top: 10%; left: 50%;
    transform: translate(-50%, 0);
    background: white; padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    z-index: 10000; text-align: center;
    min-width: 300px;
    display: flex; align-items: center; gap: 15px; justify-content: center;
    animation: popInToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border-left: 6px solid #333;
  }
  .toast-success { border-left-color: #10b981; }
  .toast-error { border-left-color: #ef4444; }
  .toast-msg { font-size: 1rem; font-weight: 600; color: #1f2937; }

  /* File Error */
  .fileX-error {
    color: #dc2626; font-size: 0.85rem; margin-top: 10px;
    background: #fef2f2; padding: 8px; border-radius: 6px;
    display: inline-block;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .complaintX-container { padding: 30px 20px; margin: 10px auto; width: 95%; }
  }
`;

class SubmitComplaints extends Component {
  constructor() {
    super();
    this.state = {
      type: "PUBLIC",
      category: "",
      priority: "",
      subject: "",
      description: "",
      fullname: "Citizen",
      files: [],
      fileError: "",
      fileInputLabel: "Upload Files",
      totalFileSize: 0,
      categories: [],
      loadingCategories: false,
      isSubmitting: false,
      notification: { show: false, message: "", type: "success" },
    };
    this.fileInputRef = createRef();
  }

  componentDidMount() {
    this.fetchCategories();
    // ✅ RESTORED: Get username from session
    const user = getSession("user_name");
    if (user) this.setState({ fullname: user });
  }

  showNotification(msg, type = "success") {
    this.setState({ notification: { show: true, message: msg, type } });
    setTimeout(() => {
      this.setState({
        notification: { show: false, message: "", type: "success" },
      });
    }, 3000);
  }

  // ✅ RESTORED: Full Logic to fetch departments from Database
  fetchCategories = () => {
    this.setState({ loadingCategories: true });
    
    // Calls the real backend endpoint
    callApi("GET", "http://localhost:8910/departments/all", "", (res) => {
      try {
        // Parse the response text
        const arr = JSON.parse(res);
        
        // Map to get names, ensure array exists
        const names = Array.isArray(arr)
          ? arr.map((d) => d.name).filter(Boolean)
          : [];
          
        this.setState({ categories: names, loadingCategories: false });
      } catch (e) {
        console.warn("Failed to parse categories or connection error", e);
        this.setState({ categories: [], loadingCategories: false });
      }
    });
  };

  setSubmissionType = (type) => this.setState({ type });

  setPriority = (pri) => this.setState({ priority: pri });

  setCategory = (cat) => this.setState({ category: cat });

  handleChange = (e) => this.setState({ [e.target.name]: e.target.value });

  handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    let { files: currFiles, totalFileSize } = this.state;
    let error = "";
    let newFiles = [...currFiles];

    for (let file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        error = `Unsupported file: ${file.name}`;
        continue;
      }
      if (totalFileSize + file.size > MAX_TOTAL_SIZE) {
        error = "Total file size must not exceed 50MB!";
        break;
      }
      newFiles.push(file);
      totalFileSize += file.size;
    }

    this.setState({
      files: newFiles,
      totalFileSize,
      fileError: error,
      fileInputLabel:
        newFiles.length > 0
          ? newFiles.map((f) => f.name).join(", ")
          : "Upload Files",
    });
    e.target.value = "";
  };

  handleRemoveFile = (idx) => {
    let files = [...this.state.files];
    let totalFileSize = this.state.totalFileSize - files[idx].size;
    files.splice(idx, 1);
    this.setState({
      files,
      totalFileSize,
      fileInputLabel:
        files.length > 0 ? files.map((f) => f.name).join(", ") : "Upload Files",
    });
  };

  // ✅ RESTORED: Submit Logic
  submitComplaint = () => {
    const {
      type,
      category,
      priority,
      subject,
      description,
      files,
      totalFileSize,
    } = this.state;

    if (!category || !priority || !subject || !description) {
      this.showNotification("Please fill all required fields!", "error");
      return;
    }
    if (totalFileSize > MAX_TOTAL_SIZE) {
      this.showNotification("Files too large! Max 50MB", "error");
      return;
    }

    // Get Token
    const token = getSession("csrid");
    if (!token) {
      this.showNotification("Session expired. Please login again.", "error");
      return;
    }

    this.setState({ isSubmitting: true });

    const fd = new FormData();
    fd.append("type", type);
    fd.append("email", token);
    fd.append("category", category);
    fd.append("priority", priority);
    fd.append("subject", subject);
    fd.append("description", description);
    fd.append("area", ""); 
    if (files.length > 0) fd.append("file", files[0]); 

    // Real Fetch Call
    fetch("http://localhost:8910/complaints/submit", {
      method: "POST",
      body: fd,
    })
      .then((r) => r.text())
      .then((txt) => {
        this.setState({ isSubmitting: false });
        // Handle backend response codes
        if (txt.startsWith("200")) {
          this.showNotification("Complaint Submitted Successfully!", "success");
          this.setState({
            category: "",
            priority: "",
            subject: "",
            description: "",
            files: [],
            totalFileSize: 0,
            fileInputLabel: "Upload Files",
          });
        } else if (txt.startsWith("401")) {
          this.showNotification("Session invalid. Login again.", "error");
        } else {
          this.showNotification(txt || "Submission failed", "error");
        }
      })
      .catch((err) => {
        this.setState({ isSubmitting: false });
        this.showNotification("Network Error: " + err.message, "error");
      });
  };

  getFileIcon(fileType) {
    if (fileType.startsWith("image/")) return <FaRegImage size={20} />;
    if (fileType.startsWith("video/")) return <FaRegFileVideo size={20} />;
    if (fileType === "application/pdf") return <FaRegFilePdf size={20} />;
    return <FaRegFileAlt size={20} />;
  }

  render() {
    const {
      type,
      category,
      priority,
      subject,
      description,
      fullname,
      files,
      fileError,
      totalFileSize,
      notification,
      isSubmitting,
    } = this.state;

    return (
      <>
        <style>{cssStyles}</style>

        {/* CUSTOM TOAST NOTIFICATION */}
        {notification.show && (
          <div className={`custom-toast toast-${notification.type}`}>
            <span className="toast-icon">
              {notification.type === "success" ? (
                <FaCheckCircle style={{ color: "#10b981", fontSize: "1.5rem" }} />
              ) : (
                <FaExclamationCircle style={{ color: "#ef4444", fontSize: "1.5rem" }} />
              )}
            </span>
            <div className="toast-msg">{notification.message}</div>
          </div>
        )}

        <div className="complaint-page-wrapper">
          {/* My Grievances header with export buttons */}
          <div className="myG-wrapper">
            <h1 className="myG-title">My Grievances</h1>
            <div className="myG-btn-row">
              <button type="button" className="myG-pill-btn">
                <span className="myG-icon">
                  <FaRegFileAlt />
                </span>
                <span>Export CSV</span>
              </button>
              <button type="button" className="myG-pill-btn">
                <span className="myG-icon">
                  <FaRegFilePdf />
                </span>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          <div className="complaintX-container">
            {/* Title */}
            <h2 className="complaintX-title">Lodge a Complaint</h2>
            <div className="complaintX-welcome">
              Hello <span className="complaintX-name">{fullname}</span>, we are
              here to help.
            </div>

            {/* Toggles */}
            <div className="typeX-toggle">
              <button
                className={type === "PUBLIC" ? "active" : ""}
                onClick={() => this.setSubmissionType("PUBLIC")}
                type="button"
              >
                Public Grievance
              </button>
              <button
                className={type === "ANONYMOUS" ? "active" : ""}
                onClick={() => this.setSubmissionType("ANONYMOUS")}
                type="button"
              >
                Anonymous
              </button>
            </div>

            {/* Form */}
            <form
              className="formX"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                this.submitComplaint();
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div>
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => this.setCategory(e.target.value)}
                    disabled={this.state.loadingCategories}
                  >
                    <option value="">
                      {this.state.loadingCategories
                        ? "Loading..."
                        : "Select Category"}
                    </option>
                    {(this.state.categories.length > 0
                      ? this.state.categories
                      : FALLBACK_CATEGORIES
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Priority</label>
                  <div className="priorityX-btns">
                    {PRIORITIES.map((pri) => (
                      <button
                        key={pri}
                        type="button"
                        className={priority === pri ? "pactive" : ""}
                        onClick={() => this.setPriority(pri)}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label>Subject</label>
              <input
                type="text"
                name="subject"
                placeholder="Brief summary of the issue..."
                value={subject}
                onChange={this.handleChange}
              />

              <label>Description</label>
              <textarea
                name="description"
                placeholder="Please describe the issue in detail (location, time, nature of problem)..."
                value={description}
                onChange={this.handleChange}
              />

              <label>Attachments (Optional)</label>
              <div className="fileX-box">
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  Drag & drop files or click to browse.
                  <br />
                  <span
                    style={{ fontSize: "0.8rem", color: "#94a3b8" }}
                  >
                    Max 50MB (Images, PDF, Video)
                  </span>
                </p>
                <input
                  type="file"
                  ref={this.fileInputRef}
                  style={{ display: "none" }}
                  onChange={this.handleFileChange}
                  multiple
                  accept={ALLOWED_TYPES.join(",")}
                />

                <button
                  type="button"
                  className="uploadX-btn"
                  onClick={() => this.fileInputRef.current.click()}
                >
                  <FaCloudUploadAlt size={18} /> Choose Files
                </button>

                {/* Previews */}
                {files.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                      marginTop: 15,
                      justifyContent: "center",
                    }}
                  >
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          background: "#fff",
                          padding: 8,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          width: 80,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <span style={{ color: "#6366f1" }}>
                          {this.getFileIcon(file.type)}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "#334155",
                            maxWidth: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginTop: 4,
                          }}
                        >
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => this.handleRemoveFile(idx)}
                          style={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#ef4444",
                            color: "white",
                            border: "2px solid white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 10,
                          }}
                        >
                          <FaRegTrashAlt />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <div
                    style={{
                      color: "#10b981",
                      fontSize: "0.8rem",
                      marginTop: 10,
                      fontWeight: 600,
                    }}
                  >
                    Total: {(totalFileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>

              {fileError && (
                <div className="fileX-error">
                  <FaExclamationCircle style={{ verticalAlign: "middle" }} />{" "}
                  {fileError}
                </div>
              )}

              <button
                className="submitX-btn"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default SubmitComplaints;