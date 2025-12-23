import React, { Component } from "react";
import "./Dashboardu.css";
import { callApi, getSession } from "./api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, CheckCircle, Clock, AlertTriangle, Activity, FileText } from "lucide-react";

export default class Dashboardu extends Component {
  constructor(props) {
    super(props);
    const today = new Date();
    this.state = {
      complaints: [],
      // Stats
      total: 0,
      pending: 0,
      review: 0,
      escalated: 0,
      resolved: 0,
      // Calendar State
      currentDate: today, 
      selectedDate: today, 
      selectedComplaints: [],
      // Recent 3
      recentComplaints: [] 
    };
  }

  componentDidMount() {
    this.loadUserComplaints();
  }

  loadUserComplaints() {
    const email = getSession("csrid");
    if (!email) return;

    const body = JSON.stringify({ csrid: email });

    callApi("POST", "http://localhost:8910/complaints/my", body, (res) => {
      try {
        const arr = JSON.parse(res);

        // Sort by Date (Newest First) & Pick Top 3
        const sortedArr = [...arr].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        const recent3 = sortedArr.slice(0, 3);

        this.setState({ 
            complaints: arr, 
            recentComplaints: recent3 
        }, () => {
          this.computeStats();
          this.handleDateClick(new Date()); 
        });
      } catch (err) {
        console.error("User dashboard error ->", err);
      }
    });
  }

  computeStats = () => {
    const { complaints } = this.state;
    let pending = 0, review = 0, escalated = 0, resolved = 0;

    complaints.forEach(c => {
      const s = (c.status || "").toLowerCase();
      if (s === "pending") pending++;
      else if (s === "under review") review++;
      else if (s === "escalated") escalated++;
      else if (s === "resolved") resolved++;
    });

    this.setState({
      total: complaints.length,
      pending, review, escalated, resolved
    });
  };

  changeMonth = (offset) => {
    const { currentDate } = this.state;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    this.setState({ currentDate: newDate });
  };

  handleDateClick = (date) => {
    const { complaints } = this.state;
    const formattedDate = date.toDateString(); 
    const filtered = complaints.filter(c => {
      if(!c.createdAt) return false;
      return new Date(c.createdAt).toDateString() === formattedDate;
    });

    this.setState({ selectedDate: date, selectedComplaints: filtered });
  };

  handleComplaintClick = (id) => {
    window.location.href = "/my-complaints"; 
  };

  renderCalendar() {
    const { currentDate, selectedDate, complaints } = this.state;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const complaintDates = {};
    complaints.forEach(c => {
        if(c.createdAt) {
            const d = new Date(c.createdAt).toDateString();
            complaintDates[d] = (complaintDates[d] || 0) + 1;
        }
    });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isSelected = dateObj.toDateString() === selectedDate.toDateString();
      const dateString = dateObj.toDateString();
      const hasComplaint = complaintDates[dateString];

      days.push(
        <div 
          key={d} 
          className={`cal-day ${isSelected ? "selected" : ""} ${hasComplaint ? "has-event" : ""}`}
          onClick={() => this.handleDateClick(dateObj)}
        >
          <span>{d}</span>
          {hasComplaint && <div className="dot"></div>}
        </div>
      );
    }

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    return (
      <div className="custom-calendar">
        <div className="cal-header">
          <button onClick={() => this.changeMonth(-1)}>&#8249;</button>
          <h4>{monthNames[month]} {year}</h4>
          <button onClick={() => this.changeMonth(1)}>&#8250;</button>
        </div>
        <div className="cal-grid-header">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>
        <div className="cal-grid">
          {days}
        </div>
      </div>
    );
  }

  render() {
    const { total, pending, review, escalated, resolved, selectedComplaints, selectedDate, recentComplaints } = this.state;
    // Semantic colors for Chart (Data needs specific colors), but UI uses Theme
    const COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981"]; 
    const pieData = [
      { name: "Pending", value: pending },
      { name: "Under Review", value: review },
      { name: "Escalated", value: escalated },
      { name: "Resolved", value: resolved }
    ].filter(d => d.value > 0);

    return (
      <div className="userDash fade-in">
        
        <div className="dash-container">
            
            {/* HEADER */}
            <div className="dash-header">
              <h1>Welcome Back!</h1>
              <p>Overview of your grievances.</p>
            </div>

            {/* METRIC CARDS */}
            <div className="metric-row">
                <div className="metric-card theme-card-1">
                    <div className="icon-box"><Activity size={24}/></div>
                    <div><h3>{total}</h3><p>Total Complaints</p></div>
                </div>
                <div className="metric-card theme-card-2">
                    <div className="icon-box"><Clock size={24}/></div>
                    <div><h3>{pending}</h3><p>Pending</p></div>
                </div>
                <div className="metric-card theme-card-3">
                    <div className="icon-box"><AlertTriangle size={24}/></div>
                    <div><h3>{escalated}</h3><p>Escalated</p></div>
                </div>
                <div className="metric-card theme-card-4">
                    <div className="icon-box"><CheckCircle size={24}/></div>
                    <div><h3>{resolved}</h3><p>Resolved</p></div>
                </div>
            </div>

            {/* MIDDLE SECTION */}
            <div className="dashboard-content">
                <div className="calendar-section card-box glass-effect">
                    <div className="cal-wrapper">{this.renderCalendar()}</div>
                    <div className="day-details">
                        <h3>Activity on {selectedDate.toLocaleDateString()}</h3>
                        {selectedComplaints.length === 0 ? (
                            <div className="no-data">
                                <Calendar size={40} opacity={0.3} />
                                <p>No complaints filed.</p>
                            </div>
                        ) : (
                            <div className="complaint-list">
                                {selectedComplaints.map((c, i) => (
                                    <div key={i} className={`mini-complaint-card status-${c.status.toLowerCase().replace(" ","-")}`}>
                                        <div className="comp-info">
                                            <strong>{c.category}</strong>
                                            <span className="comp-id">#{c.id}</span>
                                        </div>
                                        <span className="status-badge">{c.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="chart-section card-box glass-effect">
                    <h3>Overall Status</h3>
                    {total === 0 ? (
                        <p className="no-chart-data">No data available</p>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie 
                                        data={pieData} 
                                        cx="50%" cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '10px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-legend">
                                {pieData.map((entry, index) => (
                                    <div key={index} className="legend-item">
                                        <span className="dot" style={{background: COLORS[index]}}></span>
                                        <span>{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="recent-activity-full card-box glass-effect">
                <h3>Recent Activity</h3>
                {recentComplaints.length === 0 ? (
                    <p className="no-recent">No recent activity.</p>
                ) : (
                    <div className="recent-list-row">
                        {recentComplaints.map((c, i) => (
                            <div key={i} className="recent-item-wide" onClick={() => this.handleComplaintClick(c.id)}>
                                <div className="recent-icon-wide"><FileText size={20} /></div>
                                <div className="recent-info-wide">
                                    <span className="recent-cat-wide">{c.category}</span>
                                    <span className="recent-date-wide">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className={`recent-status-wide status-${c.status.toLowerCase().replace(" ","-")}`}>{c.status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
      </div>
    );
  }
}