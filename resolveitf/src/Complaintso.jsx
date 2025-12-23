import React, { Component } from "react";
import { callApi, getSession } from "./api"; // Ensure path is correct
import "./Complaintso.css";

// PDF Libraries
import jsPDF from "jspdf";
import "jspdf-autotable";

export default class Complaintso extends Component {
  constructor(props) {
    super(props);
    this.state = {
      complaints: [],
      filtered: [],
      selected: new Set(),
      q: "",
      priorityFilter: "All",
      statusFilter: "All",
      areaFilter: "All",
      dateFrom: "",
      dateTo: "",
      remarkText: {},

      // Modal State
      viewComplaint: null,
      reassignReason: "",
      officerFile: null,
      closingRemark: "",
      closeChecklist: { workDone: false },

      // Notification State
      notification: { show: false, message: "", type: "success" }
    };

    this.loadAssigned = this.loadAssigned.bind(this);
    this.applyFilters = this.applyFilters.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
    this.markResolvedSelected = this.markResolvedSelected.bind(this);
    this.sendRemark = this.sendRemark.bind(this);

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleReassign = this.handleReassign.bind(this);
    this.handleCloseComplaint = this.handleCloseComplaint.bind(this);

    this.showNotification = this.showNotification.bind(this);
    this.downloadCSV = this.downloadCSV.bind(this);
    this.downloadPDF = this.downloadPDF.bind(this);
  }

  componentDidMount() {
    this.loadAssigned();
  }

  // --- NOTIFICATIONS ---
  showNotification(msg, type = "success") {
    this.setState({ notification: { show: true, message: msg, type } });
    setTimeout(() => {
      this.setState({ notification: { show: false, message: "", type: "success" } });
    }, 3000);
  }

  // --- API LOAD ---
  loadAssigned() {
  const token = getSession("csrid");
  if (!token) return;

  const data = JSON.stringify({ csrid: token });

  callApi("POST", "http://localhost:8910/complaints/assigned", data, (res) => {
    try {
      const parsed = JSON.parse(res);

      const filtered = parsed.filter(c =>
        c.status !== "ESCALATED" ||
        (c.adminPrivateRemark || "").startsWith("Returned by Officer")
      );

      this.setState({
        complaints: filtered,
        filtered: filtered
      });
    } catch {
      console.error("Invalid response");
    }
  });
}


  // --- FILTERS & SELECTION ---
  toggleSelect(cid) {
    const selected = new Set(this.state.selected);
    selected.has(cid) ? selected.delete(cid) : selected.add(cid);
    this.setState({ selected });
  }

  applyFilters() {
    const { complaints, q, priorityFilter, statusFilter, areaFilter, dateFrom, dateTo } = this.state;
    let list = [...complaints];

    if (q.trim() !== "") {
      const qq = q.toLowerCase();
      list = list.filter(c =>
        (c.subject || "").toLowerCase().includes(qq) ||
        (c.description || "").toLowerCase().includes(qq)
      );
    }
    if (priorityFilter !== "All") list = list.filter(c => c.priority === priorityFilter);
    if (statusFilter !== "All") list = list.filter(c => c.status === statusFilter);
    if (areaFilter !== "All") list = list.filter(c => c.area === areaFilter);
    if (dateFrom) list = list.filter(c => new Date(c.createdAt) >= new Date(dateFrom));
    if (dateTo) list = list.filter(c => new Date(c.createdAt) <= new Date(dateTo));

    this.setState({ filtered: list });
  }

  // --- BULK & REMARK ACTIONS ---
  markResolvedSelected() {
    const { selected } = this.state;
    if (selected.size === 0) return this.showNotification("Please select complaints.", "error");
    if (!window.confirm("Mark selected as resolved?")) return;

    Array.from(selected).forEach(cid => {
      const data = JSON.stringify({ cid: cid.toString(), status: "Resolved" });
      callApi("POST", "http://localhost:8910/complaints/status", data, () => this.loadAssigned());
    });
    this.setState({ selected: new Set() });
    this.showNotification("Complaints Resolved!", "success");
  }

  sendRemark(cid) {
    const text = this.state.remarkText[cid];
    if (!text || !text.trim()) return this.showNotification("Enter remark first", "error");

    const payload = JSON.stringify({ cid: cid.toString(), remark: text });
    callApi("POST", "http://localhost:8910/complaints/remark", payload, res => {
      if (res.startsWith("200")) {
        this.showNotification("Remark Added", "success");
        this.loadAssigned();
        this.setState(prev => ({ remarkText: { ...prev.remarkText, [cid]: "" } }));
      } else {
        this.showNotification("Failed to add remark", "error");
      }
    });
  }

  // --- MODAL ACTIONS ---
  openModal(c) {
    this.setState({
      viewComplaint: c,
      reassignReason: "",
      officerFile: null,
      closingRemark: "",
      closeChecklist: { workDone: false }
    });
  }

  closeModal() {
    this.setState({ viewComplaint: null });
  }

  handleReassign() {
    const { viewComplaint, reassignReason } = this.state;
    if (!reassignReason.trim()) return this.showNotification("Enter reason to return", "error");

    const payload = {
      cid: viewComplaint.cid.toString(),
      status: "Escalated",
      officerEmail: "Unassigned",
      remark: "Returned by Officer: " + reassignReason
    };

    callApi("POST", "http://localhost:8910/complaints/reassign", JSON.stringify(payload), res => {
      if (res.startsWith("200")) {
        this.closeModal();
        this.loadAssigned();
        this.showNotification("Complaint Returned", "success");
      } else {
        this.showNotification("Failed to return", "error");
      }
    });
  }

  async handleCloseComplaint() {
    const { viewComplaint, officerFile, closingRemark, closeChecklist } = this.state;
    if (!closeChecklist.workDone) return this.showNotification("Confirm work completed.", "error");
    if (!closingRemark.trim()) return this.showNotification("Enter closing remark.", "error");

    const fd = new FormData();
    fd.append("cid", viewComplaint.cid.toString());
    fd.append("remark", closingRemark);
    fd.append("token", getSession("csrid"));
    if (officerFile) fd.append("file", officerFile);

    try {
      const resp = await fetch("http://localhost:8910/complaints/resolve", { method: "POST", body: fd });
      const txt = await resp.text();
      if (txt.startsWith("200")) {
        this.closeModal();
        this.loadAssigned();
        this.showNotification("Resolved Successfully!", "success");
      } else {
        this.showNotification("Error resolving complaint", "error");
      }
    } catch (err) {
      this.showNotification(err.message, "error");
    }
  }

  // --- EXPORTS ---
  downloadPDF() {
    const rows = this.state.filtered;
    if (rows.length === 0) return this.showNotification("Nothing to export", "error");
    const doc = new jsPDF("landscape");
    doc.text("Officer Report", 14, 20);
    doc.autoTable({
      startY: 30,
      head: [["ID", "Subject", "Category", "Priority", "Status", "Area", "Created", "Assigned"]],
      body: rows.map(c => [c.cid, c.subject, c.category, c.priority, c.status, c.area, c.createdAt.split(" ")[0], c.assignedAt?.split(" ")[0]]),
    });
    doc.save("officer_report.pdf");
  }

  downloadCSV() {
    const rows = this.state.filtered;
    if (rows.length === 0) return this.showNotification("Nothing to export", "error");
    const headers = ["CID", "Subject", "Category", "Priority", "Status", "Area", "Created"];
    const csvContent = [
      headers.join(","),
      ...rows.map(c => [c.cid, c.subject, c.category, c.priority, c.status, c.area, c.createdAt].join(","))
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv" }));
    link.download = "officer_data.csv";
    link.click();
  }

  // --- RENDER ---
  render() {
    const { filtered, selected, remarkText, viewComplaint, reassignReason, closingRemark, closeChecklist, notification } = this.state;

    return (
      <div className="officer-container">
        
        {/* ANIMATED TOAST NOTIFICATION */}
        {notification.show && (
          <div className={`custom-toast toast-${notification.type}`}>
            <span className="toast-icon">
              {notification.type === "success" ? "✅" : "⚠️"}
            </span>
            <div className="toast-msg">{notification.message}</div>
          </div>
        )}

        {/* HEADER */}
        <div className="officer-header">
          <div>
            <h2 className="officer-title">Officer Assigned Complaints</h2>
            <p className="officer-subtitle">Resolve & Manage Complaints</p>
          </div>
          <div className="btn-group">
            <button className="btn-csv" onClick={this.downloadCSV}>⬇ CSV</button>
            <button className="btn-pdf" onClick={this.downloadPDF}>📄 PDF</button>
            {selected.size > 0 && (
              <button className="btn-bulk" onClick={this.markResolvedSelected}>✓ Resolve ({selected.size})</button>
            )}
          </div>
        </div>

        {/* FILTERS */}
        <div className="officer-card filter-box">
          <input className="search-inp" placeholder="🔍 Search..." onChange={(e) => this.setState({ q: e.target.value }, this.applyFilters)} />
          <div className="filter-options">
            <select onChange={(e) => this.setState({ priorityFilter: e.target.value }, this.applyFilters)}>
              <option value="All">Priority: All</option><option>Low</option><option>Medium</option><option>High</option>
            </select>
            <select onChange={(e) => this.setState({ statusFilter: e.target.value }, this.applyFilters)}>
              <option value="All">Status: All</option><option>Pending</option><option>Under Review</option><option>Resolved</option>
            </select>
            <input type="date" onChange={(e) => this.setState({ dateFrom: e.target.value }, this.applyFilters)} />
            <input type="date" onChange={(e) => this.setState({ dateTo: e.target.value }, this.applyFilters)} />
          </div>
        </div>

        {/* TABLE */}
        <div className="officer-card table-wrap">
          <table className="officer-table">
            <thead>
              <tr>
                <th></th><th>ID</th><th>Subject</th><th>Category</th><th>Prio</th><th>Area</th><th>Status</th><th>Date</th><th>Note</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.cid} className={selected.has(c.cid) ? "active-row" : ""}>
                  <td><input type="checkbox" checked={selected.has(c.cid)} onChange={() => this.toggleSelect(c.cid)} /></td>
                  <td>#{c.cid}</td>
                  <td>{c.subject}</td>
                  <td><span className="badge">{c.category}</span></td>
                  <td><span className={`prio ${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                  <td>{c.area}</td>
                  <td><span className={`status ${c.status.replace(" ","").toLowerCase()}`}>{c.status}</span></td>
                  <td>{c.createdAt.split(" ")[0]}</td>
                  <td>
                    <div className="note-flex">
                      <input className="note-inp" placeholder="Note..." value={remarkText[c.cid] || ""} onChange={(e) => this.setState(p => ({ remarkText: { ...p.remarkText, [c.cid]: e.target.value } }))} />
                      <button className="note-btn" onClick={() => this.sendRemark(c.cid)}>➤</button>
                    </div>
                  </td>
                  <td><button className="view-btn" onClick={() => this.openModal(c)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL (FIXED & CENTERED) */}
        {viewComplaint && (
          <div className="officer-modal-overlay">
            <div className="officer-modal-box">
              <span className="modal-close-x" onClick={this.closeModal}>&times;</span>

              <h2 className="modal-title">{viewComplaint.subject}</h2>

              <div className="modal-info">
                <p><b>User:</b> {viewComplaint.fullname || viewComplaint.email}</p>
                <p><b>Area:</b> {viewComplaint.area}</p>
                <p><b>Date:</b> {viewComplaint.createdAt}</p>
                {viewComplaint.attachment && (
                  <p><a href={`http://localhost:8910/uploads/${viewComplaint.attachment}`} target="_blank" rel="noreferrer" className="file-link">📎 View User Attachment</a></p>
                )}
              </div>

              <div className="desc-text">{viewComplaint.description}</div>

              {/* === START NEW FEEDBACK SECTION === */}
              {viewComplaint.userFeedback || viewComplaint.rating ? (
                 <div className="feedback-display-section" style={{ background: "#fffbeb", padding: "15px", margin: "15px 0", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                   <h4 style={{ margin: "0 0 10px 0", color: "#92400e", fontWeight: "600" }}>⭐ Citizen Feedback</h4>
                   <div style={{ background: "white", padding: "12px", borderRadius: "6px", border: "1px solid #fcd34d" }}>
                     {viewComplaint.rating && (
                       <div style={{ marginBottom: "8px", color: "#555" }}>
                         <strong>Rating: </strong>
                         <span style={{ color: "#f59e0b", fontSize: "1.1rem", letterSpacing: "2px" }}>
                           {"⭐".repeat(viewComplaint.rating)}{"☆".repeat(5 - viewComplaint.rating)}
                         </span>
                         {" "}
                         <span style={{ color: "#f59e0b", fontWeight: "bold" }}>({viewComplaint.rating}/5)</span>
                       </div>
                     )}
                     {viewComplaint.userFeedback && (
                       <div style={{ fontStyle: "italic", color: "#333", marginTop: "8px", lineHeight: "1.5" }}>
                         <strong>Message:</strong> "{viewComplaint.userFeedback}"
                       </div>
                     )}
                   </div>
                 </div>
              ) : (
                <div style={{ margin: "10px 0", color: "#999", fontStyle: "italic", textAlign: "center" }}>
                   <small>No user feedback provided yet.</small>
                </div>
              )}
              {/* === END NEW FEEDBACK SECTION === */}

              {/* ACTION 1: RETURN */}
              <div className="action-section return-section">
                <input 
                  type="text" 
                  placeholder="Reason for return..." 
                  value={reassignReason}
                  onChange={(e) => this.setState({ reassignReason: e.target.value })}
                />
                <button className="btn-return" onClick={this.handleReassign}>Return to Admin</button>
              </div>

              {/* ACTION 2: RESOLVE */}
              <div className="action-section resolve-section">
                <h4>Final Resolution</h4>
                <input type="file" className="file-inp" onChange={(e) => this.setState({ officerFile: e.target.files[0] })} />
                <textarea 
                  placeholder="Describe action taken..." 
                  value={closingRemark}
                  onChange={(e) => this.setState({ closingRemark: e.target.value })}
                ></textarea>
                
                <div className="resolve-footer">
                  <label>
                    <input type="checkbox" checked={closeChecklist.workDone} onChange={(e) => this.setState({ closeChecklist: { workDone: e.target.checked } })} />
                    Confirm work completed
                  </label>
                  <button className="btn-resolve" onClick={this.handleCloseComplaint}>Resolve & Close</button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }
}