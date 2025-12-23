import React, { Component } from "react";
import "./Dashboardo.css";
import { callApi, getSession } from "./api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Compact tooltip for all charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="tooltip-card">
        {label && <p className="tooltip-title">{label}</p>}
        <p className="tooltip-value">
          {item.name ? `${item.name}: ` : "Count: "}
          <span>{item.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Motivational Quotes
const QUOTES = [
  "Quality means doing it right when no one is looking.",
  "Your attitude determines your direction.",
  "Excellence is not a skill, it is an attitude.",
  "Don't watch the clock; do what it does. Keep going.",
  "Efficiency is doing better what is already being done."
];

export default class Dashboardo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      complaints: [],
      total: 0,
      pending: 0,
      review: 0,
      resolved: 0,
      returned: 0,
      categoryCount: {},
      ratingCount: {},
      avgRating: 0,
      weeklyTrend: [],
      dailyTrend: [],
      monthlyWeeklyTrend: [],
      recentComplaints: [],
      overdueCount: 0,
      notes: "",
      currentDate: "",
      quote: "",
      
      // NEW: Filter for the merged chart
      activeChartFilter: "Weekly" // Options: Weekly, Daily, Monthly
    };
  }

  componentDidMount() {
    this.loadComplaints();
    this.loadNotes();
    this.setDate();
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    this.setState({ quote: randomQuote });
  }

  setDate = () => {
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
    const today = new Date().toLocaleDateString("en-US", options);
    this.setState({ currentDate: today });
  };

  loadNotes = () => {
    const savedNotes = localStorage.getItem("officerNotes");
    if (savedNotes) this.setState({ notes: savedNotes });
  };

  handleNoteChange = (e) => this.setState({ notes: e.target.value });

  saveNotes = () => {
    localStorage.setItem("officerNotes", this.state.notes);
    alert("Notes saved successfully!");
  };

  loadComplaints() {
    const token = getSession("csrid");
    if (!token) return;
    const data = JSON.stringify({ csrid: token });
    callApi("POST", "http://localhost:8910/complaints/assigned", data, (res) => {
      try {
        const arr = JSON.parse(res);
        const sortedArr = Array.isArray(arr) ? arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
        this.setState({ complaints: sortedArr }, this.computeStats);
      } catch (err) {
        console.error("Data error:", err);
      }
    });
  }

  computeStats = () => {
    const { complaints } = this.state;
    let pending = 0, review = 0, resolved = 0, returned = 0, overdue = 0;
    const categoryCount = {};
    const ratingCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const now = new Date();

    complaints.forEach((c) => {
      const s = String(c.status || "").trim().toLowerCase();
      if (s === "pending") pending++;
      else if (s === "under review") review++;
      else if (s === "resolved") resolved++;

      // Returned: treat as pending and effectively unassigned
      const officerEmailNorm = typeof c.officerEmail === 'string' ? c.officerEmail.trim().toLowerCase() : '';
      if (s === "pending" && (!officerEmailNorm || officerEmailNorm === "unassigned")) returned++;

      if (s !== "resolved" && c.createdAt) {
        const created = new Date(c.createdAt);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) overdue++;
      }

      if (c.category) categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
      if (c.rating) ratingCount[c.rating] = (ratingCount[c.rating] || 0) + 1;
    });

    let totalRatings = 0, totalPoints = 0;
    Object.keys(ratingCount).forEach((k) => {
      totalRatings += ratingCount[k];
      totalPoints += parseInt(k, 10) * ratingCount[k];
    });
    const avgRating = totalRatings > 0 ? Number(totalPoints / totalRatings).toFixed(1) : 0;

    this.setState({
      total: complaints.length,
      pending, review, resolved, returned, overdueCount: overdue,
      categoryCount, ratingCount, avgRating,
      weeklyTrend: this.computeWeeklyTrend(complaints),
      dailyTrend: this.computeDailyTrend(complaints),
      monthlyWeeklyTrend: this.computeMonthlyWeeklyTrend(complaints),
      recentComplaints: complaints.slice(0, 4),
    });
  };

  // Trend Helpers
  computeWeeklyTrend(complaints) {
    const weeklyMap = {};
    complaints.forEach((c) => {
      if (!c.createdAt) return;
      const date = new Date(c.createdAt);
      const firstJan = new Date(date.getFullYear(), 0, 1);
      const week = Math.ceil(((date - firstJan) / 86400000 + firstJan.getDay() + 1) / 7);
      const key = `W${week}`;
      weeklyMap[key] = (weeklyMap[key] || 0) + 1;
    });
    return Object.keys(weeklyMap).map((k) => ({ name: k, count: weeklyMap[k] }));
  }

  computeMonthlyWeeklyTrend(complaints) {
    const map = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    complaints.forEach((c) => {
      if (!c.createdAt) return;
      const date = new Date(c.createdAt);
      const key = `${months[date.getMonth()]}-W${Math.ceil(date.getDate() / 7)}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.keys(map).map((k) => ({ name: k, count: map[k] }));
  }

  computeDailyTrend(complaints) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    complaints.forEach((c) => {
      if (!c.createdAt) return;
      map[days[new Date(c.createdAt).getDay()]]++;
    });
    return Object.keys(map).map((k) => ({ name: k, count: map[k] }));
  }

  getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending": return "status-pending";
      case "under review": return "status-review";
      case "resolved": return "status-resolved";
      default: return "";
    }
  };

  render() {
    const {
      total, pending, review, resolved, returned, overdueCount,
      categoryCount, ratingCount, avgRating, recentComplaints,
      notes, currentDate, quote,
      weeklyTrend, dailyTrend, monthlyWeeklyTrend, activeChartFilter
    } = this.state;

    const PIE_COLORS = ["#f6c23e", "#36b9cc", "#1cc88a"];
    const statusPie = [
      { name: "Pending", value: pending },
      { name: "In Review", value: review },
      { name: "Resolved", value: resolved },
    ];
    const ratingBar = Object.keys(ratingCount).map((k) => ({ rating: `${k}★`, count: ratingCount[k] }));
    // const categoryBar = Object.keys(categoryCount).map((k) => ({ category: k, count: categoryCount[k] })); // kept for reference if Categories chart returns

    // Dynamic Data Selection for Merged Chart
    let chartData = [];
    let chartColor = "#4e73df";
    if (activeChartFilter === "Weekly") {
      chartData = weeklyTrend;
      chartColor = "#4e73df";
    } else if (activeChartFilter === "Daily") {
      chartData = dailyTrend;
      chartColor = "#1cc88a";
    } else {
      chartData = monthlyWeeklyTrend;
      chartColor = "#36b9cc";
    }

    return (
      <div className="officerDash">
        <svg className="chart-gradients">
          <defs>
            <linearGradient id="colorMerged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>

        {/* HEADER */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Officer Dashboard</h1>
            <p className="dash-subtitle">Clean overview of your assigned grievances.</p>
          </div>
          <div className="header-right">
            <div className="header-date">
              <span role="img" aria-label="calendar">📅</span> {currentDate}
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="metric-row">
          <div className="metric-card blue">
            <p className="metric-label">Total Assigned</p>
            <h3>{total}</h3>
          </div>
          <div className="metric-card orange">
            <p className="metric-label">Pending</p>
            <h3>{pending}</h3>
          </div>
          <div className="metric-card sky">
            <p className="metric-label">Under Review</p>
            <h3>{review}</h3>
          </div>
          <div className="metric-card green">
            <p className="metric-label">Resolved</p>
            <h3>{resolved}</h3>
          </div>
          <div className="metric-card red">
            <p className="metric-label">Returned</p>
            <h3>{returned}</h3>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="dashboard-grid">
          
          {/* LEFT COLUMN */}
          <div className="left-column">
            
            {/* AI + NOTES (Wider AI Box now) */}
            <div className="info-row">
              <div className="generic-box ai-box">
                <div className="box-header">
                  <h3>AI Suggestions</h3>
                  <span className="box-tag">Dynamic</span>
                </div>
                <ul className="ai-list">
                  <li>
                    <span className="ai-icon">💡</span>
                    <span><span className="ai-highlight">Quote:</span> "{quote}"</span>
                  </li>
                  {overdueCount > 0 ? (
                    <li>
                      <span className="ai-icon">⚠️</span>
                      <span>
                        URGENT: <span className="ai-highlight" style={{color:'#e74a3b'}}>{overdueCount} overdue</span> complaints &gt; 7 days.
                      </span>
                    </li>
                  ) : (
                    <li><span className="ai-icon">✅</span><span>No overdue complaints! Great job.</span></li>
                  )}
                  <li>
                    <span className="ai-icon">⚡</span>
                    <span>
                      Pending Load: <span className="ai-highlight">{pending}</span> tasks. 
                      {pending > 5 ? " Focus on clearing backlog." : " Workload is manageable."}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="generic-box notes-box">
                <div className="box-header">
                  <h3>Quick Notes</h3>
                </div>
                <textarea
                  placeholder="Type here..."
                  value={notes}
                  onChange={this.handleNoteChange}
                />
                <button className="primary-btn" onClick={this.saveNotes}>Save</button>
              </div>
            </div>

            {/* CHARTS ROW */}
            <div className="charts-row">
              <div className="generic-box rating-hero">
                <p className="rating-label">Avg Rating</p>
                <div className="rating-row">
                  <span className="rating-number">{avgRating}</span>
                  <span className="rating-star">★</span>
                </div>
                <div className="rating-bar-row">
                  {ratingBar.map((r) => (
                    <div key={r.rating} className="rating-bar-item">
                      <span>{r.rating}</span><span className="rating-dot" /><span>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="generic-box">
                <div className="box-header"><h3>Status Mix</h3></div>
                <div className="chart-wrapper">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusPie} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                        {statusPie.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {false && (
                <div className="generic-box">{/* Legacy Categories bar chart preserved for future use */}
                  <div className="box-header"><h3>Categories</h3></div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer>
                      <BarChart data={categoryBar} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                        <XAxis dataKey="category" tick={{ fontSize: 9 }} interval={0} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#4e73df" radius={[4, 4, 0, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Merged Charts & Recent) */}
          <div className="right-column">
            
            {/* MERGED TREND CHART */}
            <div className="generic-box trend-card">
              <div className="box-header compact" style={{flexWrap: 'wrap', gap:'10px'}}>
                <h3>Analytics Overview</h3>
                <div className="chart-toggles">
                  {['Weekly', 'Daily', 'Monthly'].map(type => (
                    <button 
                      key={type} 
                      className={`toggle-pill ${activeChartFilter === type ? 'active' : ''}`}
                      onClick={() => this.setState({ activeChartFilter: type })}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="chart-wrapper tall">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke={chartColor} fill="url(#colorMerged)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT COMPLAINTS (Moved to Right for better balance) */}
            <div className="generic-box">
              <div className="box-header">
                <h3>Recent Assigned</h3>
              </div>
              <div className="recent-list">
                {recentComplaints.map((c, i) => (
                  <div className="recent-item" key={i}>
                    <div className="recent-info">
                      <h4>#{c.id || "NA"} • {c.category}</h4>
                      <p>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className={`status-badge ${this.getStatusClass(c.status)}`}>
                      {c.status || "Unknown"}
                    </div>
                  </div>
                ))}
                {recentComplaints.length === 0 && <p className="empty-text">No recent complaints.</p>}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
}