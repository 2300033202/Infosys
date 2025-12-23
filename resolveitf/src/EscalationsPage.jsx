import React, { Component } from "react";
import { callApi } from "./api"; // Ensure this path is correct for your project
import "./EscalationsPage.css";

export default class EscalationsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      escalations: [],
      selectedComplaint: null,
      escalationHistory: [],
      higherOfficers: [],
      selectedOfficer: "",
      showModal: false
    };
  }

  componentDidMount() {
    this.fetchEscalations();
  }

  fetchEscalations = () => {
    callApi(
      "GET",
      "http://localhost:8910/complaints/all",
      "",
      (res) => {
        try {
          const data = typeof res === "string" ? JSON.parse(res) : res;

          const escalatedList = data.filter(c => {
            const status = (c.status || "").toLowerCase();
            const remark = (c.adminPrivateRemark || c.remark || "").toLowerCase();

            // Filter: show 'escalated' OR 'returned' items
            return (
              status === "escalated" ||
              remark.startsWith("returned by officer")
            );
          });

          // Sort by date descending (newest first)
          escalatedList.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          this.setState({ escalations: escalatedList });
        } catch (e) {
          console.error("Failed to load escalations", e);
        }
      }
    );
  };

  // 🔍 Open details modal
  openDetails = (complaint) => {
    this.setState({
      selectedComplaint: complaint,
      escalationHistory: [],
      higherOfficers: [],
      selectedOfficer: "",
      showModal: true
    });

    // Fetch Escalation history
    callApi(
      "GET",
      `http://localhost:8910/complaints/escalation-history/${complaint.cid}`,
      "",
      (res) => {
        const data = typeof res === "string" ? JSON.parse(res) : res;
        this.setState({ escalationHistory: data || [] });
      }
    );

    // 🔥 Load ONLY HIGHER officers (Role 4) for assignment
    callApi(
      "GET",
      "http://localhost:8910/complaints/officers",
      "",
      (res) => {
        const data = typeof res === "string" ? JSON.parse(res) : res;
        const higher = data.filter(u => Number(u.role) === 4);
        this.setState({ higherOfficers: higher });  
      }
    );
  };

  closeModal = () => {
    this.setState({
      showModal: false,
      selectedComplaint: null,
      escalationHistory: [],
      higherOfficers: [],
      selectedOfficer: ""
    });
  };

  // ✅ Assign to higher officer
  assignHigherOfficer = () => {
    const { selectedComplaint, selectedOfficer } = this.state;
    if (!selectedOfficer) return;

    callApi(
      "POST",
      "http://localhost:8910/complaints/assign",
      JSON.stringify({
        cid: selectedComplaint.cid,
        officerEmail: selectedOfficer
      }),
      () => {
        alert("Assigned to higher authority successfully");
        this.closeModal();
        this.fetchEscalations(); // Refresh main list
      }
    );
  };

  render() {
    const {
      escalations,
      selectedComplaint,
      escalationHistory,
      higherOfficers,
      selectedOfficer,
      showModal
    } = this.state;

    return (
      <div className="adminX-wrapper fade-in">
        <div className="adminX-container">

          <div className="adminX-header">
            <h2 className="adminX-title">Escalated Complaints</h2>
            <p className="adminX-subtitle">
              Escalated or returned complaints requiring admin action.
            </p>
          </div>

          <div className="adminX-table-wrapper">
            <table className="adminX-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Officer</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {escalations.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No escalated complaints found.</td>
                  </tr>
                ) : (
                  escalations.map(c => {
                    const remark = (c.adminPrivateRemark || c.remark || "").toLowerCase();
                    const isReturned = remark.startsWith("returned by officer");
                    const dateStr = c.createdAt ? c.createdAt.split(" ")[0] : "N/A";
                    
                    // Priority Badge Logic
                    const priorityClass = `badge-${(c.priority || 'medium').toLowerCase()}`;

                    return (
                      <tr key={c.cid}>
                        <td className="id-cell">#{c.cid}</td>
                        <td className="user-cell">{c.email === "ANONYMOUS" ? "Anonymous" : c.email}</td>
                        <td>{c.category}</td>
                        
                        {/* Priority Badge */}
                        <td>
                          <span className={`badge ${priorityClass}`}>
                            {c.priority}
                          </span>
                        </td>
                        
                        {/* Status with Red Outline */}
                        <td>
                          {isReturned ? (
                            <span className="status-pill pill-returned">Returned</span>
                          ) : (
                            <span className="status-pill pill-escalated">Escalated</span>
                          )}
                        </td>
                        
                        <td className="officer-cell">
                          {c.officerEmail || "Unassigned"}
                        </td>
                        <td>{dateStr}</td>
                        
                        {/* View Details Text Link */}
                        <td>
                          <button className="view-link" onClick={() => this.openDetails(c)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MODAL ================= */}
        {showModal && selectedComplaint && (
          <div className="modal-overlay" onClick={this.closeModal}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              
              {/* 1. Header */}
              <div className="modal-top-header">
                <h3 className="modal-title-h">Complaint Details #{selectedComplaint.cid}</h3>
                <button className="close-modal-x" onClick={this.closeModal}>&times;</button>
              </div>

              <div className="modal-content-body">
                
                {/* 2. Info Grid */}
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label-text">Subject</span>
                    <span className="value-text">{selectedComplaint.title || "No Subject"}</span>
                  </div>

                  <div className="info-item">
                    <span className="label-text">Category</span>
                    <span className="value-text">{selectedComplaint.category}</span>
                  </div>

                  <div className="info-item">
                    <span className="label-text">Priority</span>
                    <span className="value-text" style={{textTransform: 'capitalize'}}>
                      {selectedComplaint.priority}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="label-text">Date Filed</span>
                    <span className="value-text">{selectedComplaint.createdAt?.split(" ")[0]}</span>
                  </div>
                </div>

                {/* 3. Description Box */}
                <div className="info-item" style={{marginBottom: '8px'}}>
                  <span className="label-text">Description</span>
                </div>
                <div className="desc-box">
                  {selectedComplaint.description}
                </div>

                {/* 4. Assign Officer Section */}
                <div className="assign-card">
                  <div className="assign-header">Assign to Higher Authority</div>
                  <div className="assign-row">
                    <select
                      className="custom-select"
                      value={selectedOfficer}
                      onChange={(e) => this.setState({ selectedOfficer: e.target.value })}
                    >
                      <option value="">Select Officer...</option>
                      {higherOfficers.map(o => (
                        <option key={o.email} value={o.email}>
                          {o.fullname} ({o.department})
                        </option>
                      ))}
                    </select>
                    <button 
                      className="btn-green"
                      disabled={!selectedOfficer}
                      onClick={this.assignHigherOfficer}
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* 5. Admin Notes / Return Reason */}
                {selectedComplaint.adminPrivateRemark && (
                  <div className="warning-card">
                    <b>Note:</b> {selectedComplaint.adminPrivateRemark}
                  </div>
                )}

                {/* 6. Escalation History */}
                {escalationHistory.length > 0 && (
                  <div className="history-section">
                    <div className="history-title">Escalation History</div>
                    {escalationHistory.map((e, idx) => (
                      <div key={idx} className="history-item">
                        {e.escalatedBy} &rarr; {e.escalatedTo}: "{e.reason}"
                      </div>
                    ))}
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