import React, { Component } from "react";
import { callApi } from "./api";
import "./EscalationComplaints.css";

// Simple SVG Icons
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

class EscalationComplaints extends Component {
  state = {
    escalations: [],
    loading: true,
    selected: null,
    adminFile: null,
    fileName: "",
    adminRemark: ""
  };

  componentDidMount() {
    this.loadData();
  }

  loadData = () => {
    callApi("GET", "http://localhost:8910/complaints/all", "", (res) => {
      const data = typeof res === "string" ? JSON.parse(res) : res;

      const escalated = data.filter((c) => {
        const status = (c.status || "").toLowerCase();
        return status === "escalated" || status === "under review";
      });

      escalated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      this.setState({ escalations: escalated, loading: false });
    });
  };

  getDisplayStatus = (c) => {
    const status = (c.status || "").toLowerCase();
    if (status === "under review") return "Under Review";
    if (status === "escalated") return "Escalated";
    if (status === "resolved") return "Resolved";
    return status;
  };

  updateStatus = (cid, newStatus) => {
    callApi(
      "POST",
      "http://localhost:8910/complaints/status",
      JSON.stringify({ cid, status: newStatus }),
      () => this.loadData()
    );
  };

  handleFileSelect = (e) => {
    if (e.target.files[0]) {
      this.setState({ 
        adminFile: e.target.files[0],
        fileName: e.target.files[0].name 
      });
    }
  };

  uploadAdminFile = () => {
    const { selected, adminFile, adminRemark } = this.state;
    if (!selected) return;

    if (!adminRemark || adminRemark.trim().length === 0) {
      alert("Please enter a remark/message for the citizen.");
      return;
    }

    const fd = new FormData();
    fd.append("cid", String(selected.cid));
    fd.append("remark", adminRemark.trim());
    if (adminFile) {
      fd.append("file", adminFile);
    }

    fetch("http://localhost:8910/complaints/resolve", {
      method: "POST",
      body: fd,
    })
      .then((r) => r.text())
      .then(() => {
        alert("Resolution submitted. Citizen will see remark and proof.");
        this.setState({ adminFile: null, fileName: "", adminRemark: "", selected: null });
        this.loadData();
      })
      .catch(() => alert("Failed to submit resolution."));
  };

  render() {
    const { escalations, loading, selected, fileName, adminRemark } = this.state;

    return (
      <div className="esc-wrapper">
        <div className="esc-background-shapes"></div>
        <div className="esc-container">
          <div className="esc-header">
            <div className="header-text">
              <h2>Escalation Console</h2>
              <p className="sub">Higher Authority & Oversight Panel</p>
            </div>
            <div className="header-stats">
              <span className="stat-pill">Total: {escalations.length}</span>
            </div>
          </div>

          <div className="table-card fade-in-up">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Fetching complaints...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="esc-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {escalations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <div className="empty-content">
                            <span>✅ No pending escalations</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      escalations.map((c, index) => (
                        <tr 
                          key={c.cid} 
                          style={{ animationDelay: `${index * 0.05}s` }} 
                          className="animate-row"
                        >
                          <td className="id-cell">#{c.cid}</td>
                          <td className="subject-cell" title={c.subject}>
                            {c.subject}
                          </td>
                          <td>{c.category}</td>
                          <td>
                            <span className={`badge ${c.priority?.toLowerCase()}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td>
                            <div className="select-wrapper">
                              <select
                                value={this.getDisplayStatus(c)}
                                className={`status-select ${this.getDisplayStatus(c).toLowerCase().replace(" ", "-")}`}
                                onChange={(e) => this.updateStatus(c.cid, e.target.value)}
                              >
                                <option value="Under Review">Under Review</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                            </div>
                          </td>
                          <td className="date-cell">{c.createdAt?.split(" ")[0]}</td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() => this.setState({ selected: c })}
                            >
                              <IconEye /> Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* --- MODAL SECTION RESTORED HERE --- */}
        {selected && (
          <div className="modal-overlay" onClick={() => this.setState({ selected: null, adminFile: null, fileName: "" })}>
            <div className="modal-content zoom-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Complaint #{selected.cid}</h3>
                  <span className={`modal-badge ${selected.priority?.toLowerCase()}`}>{selected.priority} Priority</span>
                </div>
                <button className="close-btn" onClick={() => this.setState({ selected: null, adminFile: null, fileName: "" })}>
                  <IconClose />
                </button>
              </div>

              <div className="modal-body">
                <div className="info-group">
                  <label>Subject</label>
                  <p>{selected.subject}</p>
                </div>
                
                <div className="info-group">
                  <label>Description</label>
                  <p className="desc-text">{selected.description}</p>
                </div>

                <div className="meta-row">
                   <div className="info-group">
                      <label>Submitted On</label>
                      <p>{selected.createdAt}</p>
                   </div>
                   {selected.rating && (
                    <div className="info-group">
                      <label>User Rating</label>
                      <p className="rating-star">⭐ {selected.rating}/5</p>
                    </div>
                  )}
                </div>

                {selected.userFeedback && (
                   <div className="info-group feedback-box">
                      <label>User Feedback</label>
                      <p>"{selected.userFeedback}"</p>
                   </div>
                )}

                {selected.attachment && (
                  <div className="attachment-section">
                    <a
                      href={`http://localhost:8910/uploads/${selected.attachment}`}
                      target="_blank"
                      rel="noreferrer"
                      className="attachment-link"
                    >
                      📎 View Citizen Attachment
                    </a>
                  </div>
                )}

                <hr className="divider" />

                <div className="admin-action-area">
                  <h4>Higher Authority Actions</h4>
                  <div className="info-group">
                    <label>Remark / Resolution Note</label>
                    <textarea
                      value={adminRemark}
                      onChange={(e) => this.setState({ adminRemark: e.target.value })}
                      placeholder="Explain the action taken or guidance for the citizen..."
                      rows={4}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  </div>
                  <div className="file-upload-wrapper">
                    <input 
                      type="file" 
                      id="admin-file" 
                      className="file-input-hidden" 
                      onChange={this.handleFileSelect} 
                    />
                    <label htmlFor="admin-file" className="file-label">
                      {fileName ? (
                        <span className="file-selected">📄 {fileName}</span>
                      ) : (
                        <span>📂 Choose Action Report/File</span>
                      )}
                    </label>
                    <button 
                      className="upload-btn" 
                      onClick={this.uploadAdminFile}
                      disabled={!adminRemark || adminRemark.trim().length === 0}
                    >
                      <IconUpload /> Resolve / Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default EscalationComplaints;