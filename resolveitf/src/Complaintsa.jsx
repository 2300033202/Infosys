import React, { Component } from "react";
import { callApi } from "./api";
import "./Complaintsa.css"; 

// For PDF/CSV
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default class Complaintsa extends Component {
  constructor(props) {
    super(props);

    this.state = {
      complaints: [],
      filtered: [],
      officers: [],
      categoryList: [],
      selectedIds: [],

      showAssignModal: false,
      bulkOfficerEmail: "",

      viewComplaint: null,
      viewOfficerEmail: "",

      showSuccess: false,
      successMessage: "",

      // Filters
      q: "",
      categoryFilter: "All",
      priorityFilter: "All",
      statusFilter: "All",
    };

    // Bindings
    this.loadAll = this.loadAll.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.loadOfficers = this.loadOfficers.bind(this);
    this.loadCategories = this.loadCategories.bind(this);
    this.applyFilters = this.applyFilters.bind(this);

    this.assignOfficer = this.assignOfficer.bind(this);
    
    this.openViewModal = this.openViewModal.bind(this);
    this.closeViewModal = this.closeViewModal.bind(this);
    this.handleViewAssign = this.handleViewAssign.bind(this);

    this.handleSelectRow = this.handleSelectRow.bind(this);
    this.handleSelectAll = this.handleSelectAll.bind(this);
    this.openBulkAssignModal = this.openBulkAssignModal.bind(this);
    this.executeBulkAssign = this.executeBulkAssign.bind(this);

    this.triggerSuccess = this.triggerSuccess.bind(this);
    this.closeSuccess = this.closeSuccess.bind(this);

    this.downloadCSV = this.downloadCSV.bind(this);
    this.downloadPDF = this.downloadPDF.bind(this);
  }

  componentDidMount() {
    this.loadAll();
    this.loadOfficers();
    this.loadCategories();
  }

  triggerSuccess(msg) {
    this.setState({ showSuccess: true, successMessage: msg });
    setTimeout(() => this.closeSuccess(), 3000); // Auto close after 3s
  }

  closeSuccess() {
    this.setState({ showSuccess: false, successMessage: "" });
  }

  loadAll() {
    callApi("GET", "http://localhost:8910/complaints/all", "", this.handleResponse);
  }

  handleResponse(res) {
    try {
      const data = JSON.parse(res);
      // Sort by date DESC
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      this.setState({ complaints: sorted, filtered: sorted, selectedIds: [] });
    } catch {
      console.error("Failed to load complaints");
    }
  }

  loadOfficers() {
    callApi("GET", "http://localhost:8910/users/all", "", (res) => {
      try {
        const arr = JSON.parse(res);
        const officerList = arr.filter(u => u.role === 2);
        this.setState({ officers: officerList });
      } catch {
        this.setState({ officers: [] });
      }
    });
  }

  loadCategories() {
    callApi("GET", "http://localhost:8910/departments/all", "", (res) => {
      try {
        const data = JSON.parse(res);
        this.setState({ categoryList: Array.isArray(data) ? data : [] });
      } catch {}
    });
  }

  assignOfficer(cid, officerEmail) {
    const data = JSON.stringify({ cid: cid.toString(), officerEmail });
    callApi("POST", "http://localhost:8910/complaints/assign", data, () => {
      this.loadAll();
      this.triggerSuccess("Officer assigned successfully");
    });
  }

  openViewModal(c) {
    this.setState({
      viewComplaint: c,
      viewOfficerEmail: c.officerEmail || ""
    });
  }

  closeViewModal() {
    this.setState({ viewComplaint: null, viewOfficerEmail: "" });
  }

  handleViewAssign() {
    const { viewComplaint, viewOfficerEmail } = this.state;
    if (viewComplaint) {
      this.assignOfficer(viewComplaint.cid, viewOfficerEmail);
      this.closeViewModal();
    }
  }

  handleSelectRow(cid) {
    const { selectedIds } = this.state;
    this.setState({
      selectedIds: selectedIds.includes(cid)
        ? selectedIds.filter(id => id !== cid)
        : [...selectedIds, cid]
    });
  }

  handleSelectAll(e) {
    this.setState({
      selectedIds: e.target.checked ? this.state.filtered.map(c => c.cid) : []
    });
  }

  openBulkAssignModal() {
    if (this.state.selectedIds.length === 0) return alert("Please select at least one complaint.");
    this.setState({ showAssignModal: true, bulkOfficerEmail: "" });
  }

  async executeBulkAssign() {
    const { selectedIds, bulkOfficerEmail } = this.state;
    if (!bulkOfficerEmail) return alert("Please select an officer.");

    const calls = selectedIds.map(cid => {
      const data = JSON.stringify({ cid: cid.toString(), officerEmail: bulkOfficerEmail });
      return new Promise(res =>
        callApi("POST", "http://localhost:8910/complaints/assign", data, () => res())
      );
    });

    await Promise.all(calls);
    this.setState({ showAssignModal: false, selectedIds: [] });
    this.triggerSuccess(`Assigned ${selectedIds.length} complaints to officer.`);
    this.loadAll();
  }

  applyFilters() {
    const { complaints, q, categoryFilter, priorityFilter, statusFilter } = this.state;
    let list = [...complaints];

    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        c =>
          (c.subject || "").toLowerCase().includes(t) ||
          (c.description || "").toLowerCase().includes(t) ||
          ("" + c.cid).includes(t) ||
          (c.email || "").toLowerCase().includes(t)
      );
    }

    if (categoryFilter !== "All") list = list.filter(c => c.category === categoryFilter);
    if (priorityFilter !== "All") list = list.filter(c => c.priority === priorityFilter);
    if (statusFilter !== "All") list = list.filter(c => c.status === statusFilter);

    this.setState({ filtered: list, selectedIds: [] });
  }

  downloadCSV() {
    const rows = this.state.filtered;
    if (!rows.length) return alert("No data to export.");
    const headers = ["CID", "User", "Category", "Priority", "Status", "Officer", "Date", "Subject"];
    const csvRows = [headers.join(",")];
    
    rows.forEach(c => {
      const row = [
        c.cid,
        `"${c.fullname || c.email}"`,
        `"${c.category}"`,
        c.priority,
        c.status,
        `"${c.officerEmail}"`,
        c.createdAt?.split(" ")[0],
        `"${(c.subject || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "complaints_export.csv";
    a.click();
  }

  downloadPDF() {
    const rows = this.state.filtered;
    if (!rows.length) return alert("No data to export.");

    const doc = new jsPDF("landscape");
    doc.text("Complaints Report", 14, 15);

    const body = rows.map(c => [
      c.cid,
      c.fullname || c.email,
      c.category,
      c.priority,
      c.status,
      c.officerEmail,
      c.createdAt?.split(" ")[0],
      (c.subject || "").substring(0, 30)
    ]);

    autoTable(doc, {
      head: [["CID", "User", "Category", "Priority", "Status", "Officer", "Date", "Subject"]],
      body,
      startY: 25
    });

    doc.save("complaints_report.pdf");
  }

  render() {
    const {
      filtered, officers, categoryList, selectedIds,
      showAssignModal, bulkOfficerEmail,
      viewComplaint, viewOfficerEmail,
      showSuccess, successMessage,
      q 
    } = this.state;

    const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;
    
    return (
      <div className="adminX-wrapper fade-in">
        <div className="adminX-container">

          {/* === HEADER === */}
          <div className="adminX-header">
            <div>
              <h2 className="adminX-title">Manage Complaints</h2>
              <p className="adminX-subtitle">Oversee, assign, and resolve citizen grievances efficiently.</p>
            </div>
            
            <div className="adminX-header-actions">
              <button className="adminX-btn-action btn-blue" onClick={this.downloadCSV}>
                Download CSV
              </button>
              <button className="adminX-btn-action btn-blue" onClick={this.downloadPDF}>
                Download PDF
              </button>
            </div>
          </div>

          {/* === FILTERS & TOOLS === */}
          <div className="adminX-toolbar">
            <div className="adminX-filters">
              <input 
                className="adminX-input" 
                placeholder="Search complaints..." 
                value={q}
                onChange={(e) => this.setState({ q: e.target.value })}
                onKeyUp={(e) => e.key === "Enter" && this.applyFilters()}
              />
              
              <select className="adminX-select" onChange={(e) => this.setState({ categoryFilter: e.target.value })}>
                <option value="All">All Categories</option>
                {categoryList.map((cat, i) => <option key={i} value={cat.name}>{cat.name}</option>)}
              </select>
              
              <select className="adminX-select" onChange={(e) => this.setState({ priorityFilter: e.target.value })}>
                <option value="All">All Priorities</option>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
              
              <select className="adminX-select" onChange={(e) => this.setState({ statusFilter: e.target.value })}>
                <option value="All">All Status</option>
                <option>Pending</option><option>Under Review</option><option>Escalated</option><option>Resolved</option>
              </select>
              
              <button className="adminX-btn-icon" onClick={this.applyFilters}>🔍</button>
            </div>

            <div className="adminX-bulk-actions">
              <button className="adminX-btn-sm btn-purple" onClick={this.openBulkAssignModal}>Assign Selected</button>
            </div>
          </div>

          {/* === TABLE === */}
          <div className="adminX-table-wrapper">
            <table className="adminX-table">
              <thead>
                <tr>
                  <th width="40">
                    <input type="checkbox" checked={isAllSelected} onChange={this.handleSelectAll} />
                  </th>
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
                {filtered.map((c) => {
                  const isSelected = selectedIds.includes(c.cid);
                  
                  // LOGIC UPDATE: Force "Pending" if no officer is assigned
                  const isAssigned = c.officerEmail && c.officerEmail.trim() !== "";
                  const displayStatus = isAssigned ? (c.status || "Pending") : "Pending";
                  
                  const statusClass = `status-pill pill-${displayStatus.toLowerCase().replace(" ","")}`;
                  
                  return (
                    <tr key={c.cid} className={isSelected ? "selected-row" : ""}>
                      <td>
                        <input type="checkbox" checked={isSelected} onChange={() => this.handleSelectRow(c.cid)} />
                      </td>
                      <td><b>#CM{c.cid}</b></td>
                      <td>
                        <div className="user-cell">
                            <span className="user-avatar">{c.fullname ? c.fullname[0] : "U"}</span>
                            <span>{c.email === "ANONYMOUS" ? "Anonymous" : c.fullname || c.email}</span>
                        </div>
                      </td>
                      <td>{c.category}</td>
                      <td><span className={`priority-dot p-${c.priority.toLowerCase()}`}></span> {c.priority}</td>
                      
                      {/* STATUS COLUMN - Uses calculated 'displayStatus' */}
                      <td>
                        <span className={statusClass}>
                           {displayStatus}
                        </span>
                      </td>

                      <td>
                        <select 
                          className="officer-select" 
                          value={c.officerEmail || ""} 
                          onChange={(e) => this.assignOfficer(c.cid, e.target.value)}
                        >
                          <option value="">-- Assign --</option>
                          {officers.map(o => {
                            const availability = (o.availabilityStatus || "ACTIVE").toUpperCase();
                            const prefix = availability === "ON_LEAVE" ? "🔴" : "🟢";
                            const suffix = availability === "ON_LEAVE" ? " (On Leave)" : "";
                            return (
                              <option key={o.email} value={o.email}>{`${prefix} ${o.fullname}${suffix}`}</option>
                            );
                          })}
                        </select>
                      </td>
                      <td>{c.createdAt?.split(" ")[0]}</td>
                      <td>
                        <button className="view-link" onClick={() => this.openViewModal(c)}>View Details</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="no-data">No records found matching your filters.</div>}
          </div>

          {/* === MODALS === */}
          
          {/* Bulk Assign Modal */}
          {showAssignModal && (
            <div className="modal-overlay">
              <div className="modal-card slide-down">
                <h3>Assign Officer (Bulk)</h3>
                <p>Assigning <strong>{selectedIds.length}</strong> selected complaints.</p>
                <select className="full-width-select" onChange={(e) => this.setState({ bulkOfficerEmail: e.target.value })}>
                  <option value="">Select Officer</option>
                  {officers.map(o => {
                    const availability = (o.availabilityStatus || "ACTIVE").toUpperCase();
                    const prefix = availability === "ON_LEAVE" ? "🔴" : "🟢";
                    const suffix = availability === "ON_LEAVE" ? " (On Leave)" : "";
                    return (
                      <option key={o.email} value={o.email}>{`${prefix} ${o.fullname}${suffix}`}</option>
                    );
                  })}
                </select>
                <div className="modal-footer">
                  <button className="btn-cancel" onClick={() => this.setState({ showAssignModal: false })}>Cancel</button>
                  <button className="btn-save" onClick={this.executeBulkAssign}>Assign Now</button>
                </div>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {viewComplaint && (
            <div className="modal-overlay" onClick={this.closeViewModal}>
              <div className="modal-card wide slide-down" onClick={e => e.stopPropagation()}>
                <button className="close-x" onClick={this.closeViewModal}>×</button>
                
                {/* Apply Logic to Modal Header as well */}
                {(() => {
                    const isAssigned = viewComplaint.officerEmail && viewComplaint.officerEmail.trim() !== "";
                    const modalStatus = isAssigned ? (viewComplaint.status || "Pending") : "Pending";
                    
                    return (
                        <div className="detail-header">
                            <h3>Complaint #{viewComplaint.cid}</h3>
                            <span className={`status-pill pill-${modalStatus.toLowerCase().replace(" ","")}`}>
                                {modalStatus}
                            </span>
                        </div>
                    );
                })()}
                
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Subject</label>
                    <p>{viewComplaint.subject}</p>
                  </div>
                  <div className="detail-item">
                    <label>Category</label>
                    <p>{viewComplaint.category}</p>
                  </div>
                  <div className="detail-item">
                    <label>Priority</label>
                    <p><span className={`priority-dot p-${viewComplaint.priority.toLowerCase()}`}></span> {viewComplaint.priority}</p>
                  </div>
                  <div className="detail-item">
                    <label>Date Filed</label>
                    <p>{viewComplaint.createdAt?.split(" ")[0]}</p>
                  </div>
                </div>
                
                <div className="detail-desc-box">
                  <label>Full Description</label>
                  <p>{viewComplaint.description}</p>
                </div>

                <div className="assign-section">
                  <label>Assign Officer</label>
                  <div className="assign-row">
                    <select 
                      className="modal-select"
                      value={viewOfficerEmail} 
                      onChange={(e) => this.setState({ viewOfficerEmail: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {officers.map(o => {
                        const availability = (o.availabilityStatus || "ACTIVE").toUpperCase();
                        const prefix = availability === "ON_LEAVE" ? "🔴" : "🟢";
                        const suffix = availability === "ON_LEAVE" ? " (On Leave)" : "";
                        return (
                          <option key={o.email} value={o.email}>{`${prefix} ${o.fullname}${suffix}`}</option>
                        );
                      })}
                    </select>
                    <button className="btn-save small" onClick={this.handleViewAssign}>Update Officer</button>
                  </div>
                </div>

                {viewComplaint.adminPrivateRemark && (
                    <div className="admin-notes">
                        <strong>Admin Notes:</strong> {viewComplaint.adminPrivateRemark}
                    </div>
                )}
              </div>
            </div>
          )}

          {/* Success Toast */}
          {showSuccess && (
            <div className="toast-success slide-up">
              <span className="toast-icon">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

        </div>
      </div>
    );
  }
}