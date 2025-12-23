import React, { Component } from 'react';
import { callApi } from "./api";
import "./Users.css";

export default class Users extends Component {
  constructor() {
    super();
    this.state = { 
        list: [],
        departments: [],
        searchQuery: "",
        roleFilter: "All",
        deptFilter: "All",

        // Modal States
        showAddModal: false,
        showEditModal: false,

        // Data for Modals
        newUser: { fullname: "", email: "", role: "User", department: "", availabilityStatus: "ACTIVE" },
        editingUser: { fullname: "", email: "", role: "User", department: "", availabilityStatus: "ACTIVE" },

        loading: false
    };

    this.loadUsers = this.loadUsers.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.loadDepartments = this.loadDepartments.bind(this);

    this.openAddModal = this.openAddModal.bind(this);
    this.closeAddModal = this.closeAddModal.bind(this);
    this.saveNewUser = this.saveNewUser.bind(this);

    this.openEditModal = this.openEditModal.bind(this);
    this.closeEditModal = this.closeEditModal.bind(this);
    this.saveEditUser = this.saveEditUser.bind(this);

    this.blockUser = this.blockUser.bind(this);
    this.resetPass = this.resetPass.bind(this);
  }

  componentDidMount() {
    this.loadUsers();
    this.loadDepartments();
  }

  // ========================= LOAD DEPARTMENTS =========================
  loadDepartments() {
    callApi("GET", "http://localhost:8910/departments/all", "", (res) => {
      try {
        let arr = typeof res === "string" ? JSON.parse(res) : res;
        this.setState({ departments: arr });
      } catch (e) {
        console.error("Failed to load departments", e);
      }
    });
  }

  // ========================= LOAD USERS =========================
  setLoading(v) { this.setState({ loading: v }); }

  loadUsers() {
    this.setLoading(true);
    callApi("GET", "http://localhost:8910/users/all", null, this.handleResponse);
  }

  handleResponse(res) {
    this.setLoading(false);
    try {
      let arr = typeof res === "string" ? JSON.parse(res) : res;
      this.setState({ list: arr });
    } catch (e) {
      console.error("Bad users JSON:", e);
      alert("Failed to load users");
    }
  }

  // Role helpers
  roleToInt(r) {
    if (!r) return 3;
    r = r.toLowerCase();
    if (r === "admin") return 1;
    if (r === "officer") return 2;
    return 3;
  }
  intToRole(n) {
    if (n === 1) return "Admin";
    if (n === 2) return "Officer";
    return "User";
  }

  // ========================= ADD USER =========================
  openAddModal() { this.setState({ showAddModal: true }); }
  closeAddModal() { 
    this.setState({ 
      showAddModal: false, 
      newUser: { fullname: "", email: "", role: "User", department: "", availabilityStatus: "ACTIVE" }
    }); 
  }

  saveNewUser() {
      const { newUser } = this.state;

      if (!newUser.email || !newUser.fullname) {
        alert("Name and Email required");
        return;
      }

      let role = newUser.role;
      let finalDept = "-";
      if (role === "Admin") finalDept = "All";
      else if (role === "Officer") {
        if (!newUser.department) {
          alert("Select department for Officer");
          return;
        }
        finalDept = newUser.department;
      } else {
        finalDept = "-";
      }

      const payload = {
        fullname: newUser.fullname,
        email: newUser.email.trim().toLowerCase(),
        role: this.roleToInt(role),
        department: finalDept,
        availabilityStatus: "ACTIVE" // Default to Active
      };

      this.setLoading(true);
      callApi("POST", "http://localhost:8910/users/signup", JSON.stringify(payload), (res) => {
          this.setLoading(false);
          if (res.startsWith("200::")) {
            alert("User added");
            this.closeAddModal();
            this.loadUsers();
          } else alert(res);
      });
  }

  // ========================= EDIT USER =========================
  openEditModal(user) {
      this.setState({ 
        showEditModal: true, 
        editingUser: { 
            fullname: user.fullname || "",
            email: user.email,
            role: this.intToRole(user.role),
            department: user.department || "-",
            availabilityStatus: (user.availabilityStatus || "ACTIVE").toUpperCase()
        } 
      });
  }
  closeEditModal() { this.setState({ showEditModal: false }); }

  saveEditUser() {
      const { editingUser } = this.state;

      let role = editingUser.role;
      let finalDept = "-";
      const availability = (editingUser.availabilityStatus || "ACTIVE").toUpperCase();

      if (role === "Admin") {
        finalDept = "All";
      } else if (role === "Officer") {
        if (!editingUser.department) {
          alert("Select department for Officer");
          return;
        }
        finalDept = editingUser.department;
      } else {
        finalDept = "-";
      }

      const payload = {
        email: editingUser.email,
        fullname: editingUser.fullname,
        role: String(this.roleToInt(role)),
        department: finalDept,
        availabilityStatus: availability
      };

      this.setLoading(true);
      callApi("POST", "http://localhost:8910/users/adminupdate", JSON.stringify(payload), (res) => {
        this.setLoading(false);
        if (res.startsWith("200::")) {
          alert("Saved");
          this.closeEditModal();
          this.loadUsers();
        } else alert(res);
      });
  }

  // ========================= ACTIONS =========================
  blockUser(email, blocked) {
    if (!window.confirm(blocked ? "Unblock user?" : "Block user?")) return;

    this.setLoading(true);
    callApi("POST", "http://localhost:8910/users/block", JSON.stringify({ email }), (res) => {
        this.setLoading(false);
        alert(res);
        this.loadUsers();
    });
  }

  resetPass(email) {
    if (!window.confirm("Reset password for " + email + "?")) return;
    this.setLoading(true);

    callApi("POST", "http://localhost:8910/users/resetpass", JSON.stringify({ email }), (res) => {
        this.setLoading(false);
        alert(res);
    });
  }

  // ========================= RENDER =========================
  render() {
    const { 
      list, searchQuery, roleFilter, deptFilter, 
      showAddModal, showEditModal,
      newUser, editingUser, departments,
      loading
    } = this.state;

    // Filter users
    const filteredList = list.filter(u => {
      const s = searchQuery.toLowerCase();
      let rn = u.role === 1 ? "Admin" : u.role === 2 ? "Officer" : "User";

      return (
        (u.fullname || "").toLowerCase().includes(s) ||
        (u.email || "").toLowerCase().includes(s)
      ) &&
      (roleFilter === "All" || rn === roleFilter) &&
      (deptFilter === "All" || u.department === deptFilter);
    });

    return (
      <div className="usersX-container">

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="loading-overlay">Loading...</div>
        )}

        {/* HEADER */}
        <div className="usersX-header">
            <div>
                <h2 className="usersX-title">User Management</h2>
                <div className="usersX-stats">Total Users: {list.length}</div>
            </div>
            <button className="usersX-btn-add" onClick={this.openAddModal}>
                + Add User
            </button>
        </div>

        {/* FILTERS */}
        <div className="usersX-filters">
            <input 
                type="text"
                className="usersX-search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e)=>this.setState({searchQuery:e.target.value})}
            />
            <select className="usersX-select" value={roleFilter} onChange={(e)=>this.setState({roleFilter:e.target.value})}>
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Officer">Officer</option>
                <option value="User">User</option>
            </select>

            {/* Dynamic departments */}
            <select className="usersX-select" value={deptFilter} onChange={(e)=>this.setState({deptFilter:e.target.value})}>
                <option value="All">All Departments</option>
                {[...new Set(list.map(x => x.department))]
                  .filter(d => d && d !== "-" && d !== "All")
                  .map(d => <option key={d}>{d}</option>)}
            </select>
        </div>

        {/* TABLE */}
        <div className="usersX-card">
            <table className="usersX-table">
              <thead>
                <tr>
                  <th>ID</th> {/* <--- ADDED ID HEADER */}
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredList.map((u, i) => {
                  let rn = u.role === 1 ? "Admin" : u.role === 2 ? "Officer" : "User";
                  let badge = u.role === 1 ? "role-admin" : u.role === 2 ? "role-officer" : "role-user";
                  let isOfficer = u.role === 2;
                  const availability = (u.availabilityStatus || "ACTIVE").toUpperCase();
                  const isOnLeave = availability === "ON_LEAVE";

                  return (
                    <tr key={u.email}>
                      <td>#U{1000+i}</td> {/* <--- ADDED ID CELL */}
                      
                      <td style={{textAlign:"left"}}>
                        <div className="usersX-profile">
                          <div className="usersX-avatar">{u.fullname ? u.fullname[0] : "U"}</div>
                          <div>
                            <div className="usersX-name">
                              {u.fullname} {u.blocked && <span style={{color:"red"}}>(Blocked)</span>}
                            </div>
                            <div className="usersX-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`usersX-badge ${badge}`}>{rn}</span></td>
                      <td>{u.role === 1 ? "All" : u.department}</td>
                      
                      {/* Status Logic */}
                      <td>
                        {isOfficer ? (
                          isOnLeave ? 
                          <span className="status-tag tag-leave">🔴 On Leave</span> : 
                          <span className="status-tag tag-active">🟢 Active</span>
                        ) : (
                           <span className="status-na">-</span>
                        )}
                      </td>

                      <td>
                        <div className="usersX-actions">
                            {/* Edit feature temporarily disabled — keep for future
                              <button className="act-btn btn-edit" onClick={()=>this.openEditModal(u)}>✎</button>
                            */}
                          <button className="act-btn btn-block" onClick={()=>this.blockUser(u.email, u.blocked)}>{u.blocked ? "↺" : "⊘"}</button>
                          <button className="act-btn btn-key" onClick={()=>this.resetPass(u.email)}>🔑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
        </div>

        {/* ===================== ADD USER MODAL ===================== */}
        {showAddModal && (
          <div className="usersX-modal-overlay">
            <div className="usersX-modal">

              <div className="usersX-modal-header">
                <h3>Add User</h3>
                <span className="close-x" onClick={this.closeAddModal}>×</span>
              </div>

              <div className="usersX-form-group">
                <label>Name</label>
                <input className="usersX-input"
                  value={newUser.fullname}
                  onChange={e=>this.setState({newUser:{...newUser,fullname:e.target.value}})}
                />
              </div>

              <div className="usersX-form-group">
                <label>Email</label>
                <input className="usersX-input"
                  value={newUser.email}
                  onChange={e=>this.setState({newUser:{...newUser,email:e.target.value}})}
                />
              </div>

              <div className="usersX-form-group">
                <label>Role</label>
                <select className="usersX-input"
                  value={newUser.role}
                  onChange={e=>this.setState({newUser:{...newUser,role:e.target.value}})}
                >
                  <option>User</option>
                  <option>Officer</option>
                  <option>Admin</option>
                </select>
              </div>

              {newUser.role === "Officer" && (
                <div className="usersX-form-group">
                  <label>Department</label>
                  <select
                    className="usersX-input"
                    value={newUser.department}
                    onChange={e=>this.setState({newUser:{...newUser,department:e.target.value}})}
                  >
                    <option value="">--Select--</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button className="usersX-modal-btn" onClick={this.saveNewUser}>
                Add User
              </button>

            </div>
          </div>
        )}

        

        {/* ===================== EDIT USER MODAL ===================== */}
        {showEditModal && (
          <div className="usersX-modal-overlay">
            <div className="usersX-modal">

              <div className="usersX-modal-header">
                <h3>Edit User</h3>
                <span className="close-x" onClick={this.closeEditModal}>×</span>
              </div>

              <div className="usersX-form-group">
                <label>Name</label>
                <input className="usersX-input"
                  value={editingUser.fullname}
                  onChange={e=>this.setState({editingUser:{...editingUser,fullname:e.target.value}})}
                />
              </div>

              <div className="usersX-form-group">
                <label>Email</label>
                <input className="usersX-input" value={editingUser.email} disabled />
              </div>

              <div className="usersX-form-group">
                <label>Role</label>
                <select className="usersX-input"
                  value={editingUser.role}
                  onChange={e=>this.setState({editingUser:{...editingUser,role:e.target.value}})}
                >
                  <option>User</option>
                  <option>Officer</option>
                  <option>Admin</option>
                </select>
              </div>

              {editingUser.role === "Officer" && (
                <>
                  <div className="usersX-form-group">
                    <label>Department</label>
                    <select
                      className="usersX-input"
                      value={editingUser.department}
                      onChange={e=>this.setState({editingUser:{...editingUser,department:e.target.value}})}
                    >
                      <option value="">--Select--</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* ACTIVE/ON-LEAVE TOGGLE */}
                  <div className="usersX-form-group" style={{background:'#f9f9f9', padding:'10px', borderRadius:'8px', border:'1px dashed #ddd'}}>
                    <label style={{color:'#333', fontWeight:'bold', marginBottom:'8px', display:'block'}}>
                        Officer Availability
                    </label>
                    <div style={{display:'flex', gap:'20px'}}>
                        <label style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'14px'}}>
                            <input 
                                type="radio" 
                              name="availability"
                              checked={(editingUser.availabilityStatus || "ACTIVE").toUpperCase() === "ACTIVE"}
                              onChange={()=>this.setState({editingUser:{...editingUser, availabilityStatus: "ACTIVE"}})}
                            /> 
                            🟢 Active
                        </label>
                        <label style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'14px'}}>
                            <input 
                                type="radio" 
                              name="availability"
                              checked={(editingUser.availabilityStatus || "ACTIVE").toUpperCase() === "ON_LEAVE"}
                              onChange={()=>this.setState({editingUser:{...editingUser, availabilityStatus: "ON_LEAVE"}})}
                            /> 
                            🔴 On Leave
                        </label>
                    </div>
                  </div>
                </>
              )}

              <button className="usersX-modal-btn" onClick={this.saveEditUser}>
                Save Changes
              </button>

            </div>
          </div>
        )}

      </div>
    );
  }
}