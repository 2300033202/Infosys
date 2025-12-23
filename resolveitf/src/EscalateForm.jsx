import React, { Component } from "react";
import "./EscalateForm.css";
import { callApi } from "./api";

export default class EscalateForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      escalateTo: "",
      reason: "",
      notifyAll: false,
      officerList: [], // Renamed for clarity, but works same as adminList
      loading: false
    };
  }

  componentDidMount() {
    this.loadOfficers();
  }

  loadOfficers() {
    callApi("GET", "http://localhost:8910/users/all", "", (res) => {
      try {
        const arr = JSON.parse(res);
        // Filter for Admins (1) or Officers (2) depending on your needs
        const officers = arr.filter((u) => u.role === 1 || u.role === 2);
        this.setState({ officerList: officers });
      } catch (err) {
        console.error("Failed to load officers", err);
      }
    });
  }

  submitEscalation = () => {
    const { escalateTo, reason, notifyAll } = this.state;
    const { complaint, onSubmitted } = this.props;

    if (!escalateTo) return alert("Please select a higher authority.");
    if (!reason.trim()) return alert("Please enter a reason for escalation.");

    this.setState({ loading: true });

    const loggedEmail = sessionStorage.getItem("csremail") || "admin@system";
    // SQL compatible timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    const body = JSON.stringify({
      cid: complaint.cid.toString(),
      escalatedBy: loggedEmail,
      escalatedTo: escalateTo,
      notifyAll: notifyAll, // boolean
      reason: reason,
      createdAt: timestamp
    });

    callApi("POST", "http://localhost:8910/complaints/escalate", body, () => {
      this.setState({ loading: false });
      if (onSubmitted) onSubmitted(); // Parent handles refresh/close
    });
  };

  render() {
    const { complaint, onClose } = this.props;
    const { officerList, loading } = this.state;

    if (!complaint) return null;

    return (
      <div className="esc-modal-overlay">
        <div className="esc-modal-card">
          
          {/* RED HEADER */}
          <div className="esc-header">
            Escalate Complaint
          </div>

          <div className="esc-body">
            
            {/* COMPLAINT TITLE SECTION */}
            <div className="esc-group">
              <label className="esc-label">COMPLAINT TITLE</label>
              <div className="esc-subject">{complaint.subject}</div>
              <div className="esc-id">Complaint ID: CMP{complaint.cid}</div>
            </div>

            {/* ESCALATE TO DROPDOWN */}
            <div className="esc-group">
              <label className="esc-label">ESCALATE TO</label>
              <select
                className="esc-select"
                value={this.state.escalateTo}
                onChange={(e) => this.setState({ escalateTo: e.target.value })}
              >
                <option value="">Select Higher Authority</option>
                {officerList.map((off) => (
                  <option key={off.email} value={off.email}>
                    {off.fullname || off.email}
                  </option>
                ))}
              </select>
            </div>

            {/* NOTIFY CHECKBOX */}
            <div className="esc-checkbox-group">
              <input
                type="checkbox"
                id="notifyCheck"
                checked={this.state.notifyAll}
                onChange={(e) => this.setState({ notifyAll: e.target.checked })}
              />
              <label htmlFor="notifyCheck">NOTIFY ALL PARTIES</label>
            </div>

            {/* REASON TEXTAREA */}
            <div className="esc-group">
              <textarea
                className="esc-textarea"
                placeholder="Enter reason for escalation..."
                value={this.state.reason}
                onChange={(e) => this.setState({ reason: e.target.value })}
                rows={4}
              />
            </div>

            {/* BUTTONS */}
            <div className="esc-actions">
              <button 
                className="esc-btn-primary" 
                onClick={this.submitEscalation}
                disabled={loading}
              >
                {loading ? "Processing..." : "Escalate Complaint"}
              </button>
              
              <button 
                className="esc-btn-secondary" 
                onClick={onClose}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }
}