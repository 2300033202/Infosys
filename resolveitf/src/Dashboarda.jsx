import React, { Component } from "react";
import "./Dashboarda.css";
import { callApi } from "./api"; 
import { 
  PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, Legend, 
  AreaChart, Area, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { 
  AlertTriangle, CheckCircle, Clock, Activity, 
  TrendingUp, Sparkles, 
  ArrowUpRight, FileText
} from "lucide-react";

export default class Dashboarda extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // DEFAULT MOCK DATA
      totalComplaints: 124,
      pending: 45,
      review: 30,
      escalated: 12,
      resolved: 37,
      avgResolutionTime: 2.4,

      statusData: [
        { name: "Pending", value: 45, color: "#f59e0b" },
        { name: "Review", value: 30, color: "#3b82f6" },
        { name: "Escalated", value: 12, color: "#ef4444" },
        { name: "Resolved", value: 37, color: "#10b981" }
      ],

      categoryData: [
        { name: "Sanitation", count: 40 },
        { name: "Water", count: 35 },
        { name: "Roads", count: 20 },
        { name: "Electricity", count: 15 },
        { name: "Traffic", count: 14 }
      ],

      officerData: [
        { name: "Officer Raj", resolved: 12 },
        { name: "Officer Priya", resolved: 10 },
        { name: "Officer Anil", resolved: 8 },
        { name: "Officer Sunita", resolved: 5 },
        { name: "Officer John", resolved: 2 }
      ],

      weeklyTrend: [
        { date: "Mon", count: 12 },
        { date: "Tue", count: 19 },
        { date: "Wed", count: 15 },
        { date: "Thu", count: 22 },
        { date: "Fri", count: 18 },
        { date: "Sat", count: 10 },
        { date: "Sun", count: 5 }
      ],

      // Default 4 mock items
      recentActivity: [
        { cid: 101, status: "Resolved", category: "Water Leakage", officer: "Raj Kumar", createdAt: new Date().toISOString() },
        { cid: 102, status: "Escalated", category: "Potholes", officer: "Unassigned", createdAt: new Date().toISOString() },
        { cid: 103, status: "Pending", category: "Street Light", officer: "Priya S", createdAt: new Date().toISOString() },
        { cid: 104, status: "Under Review", category: "Garbage", officer: "Anil K", createdAt: new Date().toISOString() },
      ],

      aiSuggestions: [
        "⚠ High Escalation Rate: 12 cases need immediate attention.",
        "📉 Backlog Alert: 45 pending cases. Consider assigning more officers.",
        "✅ Sanitation department is performing well this week."
      ],
      
      loading: true 
    };
  }

  componentDidMount() {
    this.loadData(); 
  }

  formatDate = () => {
    const today = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
  };

  loadData() {
    // 1. Get All Complaints from Backend
    callApi("GET", "http://localhost:8910/complaints/all", "", (res) => {
      try {
        const complaints = JSON.parse(res);
        
        // 2. Get All Users (for Officer names if needed)
        callApi("GET", "http://localhost:8910/users/all", "", (res2) => {
          let users = [];
          try { users = JSON.parse(res2); } catch(e) { console.warn("User parse error", e); }
          
          this.setState({ complaints, users, loading: false }, this.computeStats);
        });

      } catch(err) {
        console.error("Error parsing complaints:", err);
        // Fallback to mock data on error so page isn't blank
        this.setState({ loading: false, aiSuggestions: ["Error loading data. Showing cached/mock data."] });
      }
    });
  }

  computeStats = () => {
    const { complaints, users = [] } = this.state;
    
    // Counters
    let pending = 0, review = 0, escalated = 0, resolved = 0;
    let categoryCount = {};
    let officerCount = {};
    let totalResolutionDays = 0;
    
    // Build a quick lookup from officer email -> fullname
    const emailToName = {};
    users.forEach(u => {
      const em = (u && u.email ? String(u.email).trim().toLowerCase() : "");
      const name = (u && u.fullname ? String(u.fullname).trim() : "");
      if (em && name) emailToName[em] = name;
    });

    // Date Helpers for Weekly Trend (normalize to YYYY-MM-DD keys)
    const today = new Date();
    const last7DaysDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(today.getDate() - i);
      last7DaysDates.push(d);
    }

    const last7Keys = last7DaysDates.map(d => d.toISOString().slice(0,10));
    let weeklyMap = {};
    last7Keys.forEach(k => weeklyMap[k] = 0);

    // Process Complaints
    complaints.forEach(c => {
      const status = (c.status || "Pending");
      const statusNorm = String(status).trim().toLowerCase();
      const cat = c.category || "General";
      // Officer name: use raw value, trim, and validate later for performance count
      const rawOfficer = typeof c.officerName === "string" ? c.officerName.trim() : "";
      
      const createdDate = c.createdAt ? new Date(c.createdAt) : new Date();
      createdDate.setHours(0,0,0,0);
      const createdKey = createdDate.toISOString().slice(0,10);

      // 1. Status Counts (normalized)
      if (statusNorm === "pending") pending++;
      else if (statusNorm === "under review") review++;
      else if (statusNorm === "escalated") escalated++;
      else if (statusNorm === "resolved") {
        resolved++;
        const endDate = c.resolvedAt ? new Date(c.resolvedAt) : today;
        endDate.setHours(0,0,0,0);
        const startDate = new Date(createdDate);
        const diffTime = Math.abs(endDate - startDate);
        totalResolutionDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      }

      // 2. Category Counts
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;

        // 3. Officer Performance (Resolved only, valid officer names only)
        if (statusNorm === "resolved") {
          let officerName = rawOfficer;
          if (!officerName) {
            const email = typeof c.officerEmail === "string" ? c.officerEmail.trim().toLowerCase() : "";
            if (email && emailToName[email]) officerName = emailToName[email];
          }
          if (officerName && officerName.toLowerCase() !== "unassigned") {
            officerCount[officerName] = (officerCount[officerName] || 0) + 1;
          }
        }

        // 4. Weekly Trend 
        if (weeklyMap.hasOwnProperty(createdKey)) {
          weeklyMap[createdKey]++;
        }
    });

    // --- Format Data ---

    const statusData = [
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "Review", value: review, color: "#3b82f6" },
      { name: "Escalated", value: escalated, color: "#ef4444" },
      { name: "Resolved", value: resolved, color: "#10b981" }
    ].filter(d => d.value > 0);

    const categoryData = Object.keys(categoryCount)
        .map(k => ({ name: k, count: categoryCount[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const officerData = Object.keys(officerCount)
        .map(k => ({ name: k, resolved: officerCount[k] }))
        .sort((a, b) => b.resolved - a.resolved)
        .slice(0, 5);

    const weeklyTrend = last7DaysDates.map(d => {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const key = d.toISOString().slice(0,10);
      return { date: dayName, count: weeklyMap[key] };
    });

    let avgTime = resolved > 0 ? (totalResolutionDays / resolved).toFixed(1) : 0;

    // --- RECENT ACTIVITY (LIMIT TO 4) ---
    const recentActivity = [...complaints]
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4); 

    // Generate AI Insights
    let aiSuggestions = [];
    if (escalated > 0) aiSuggestions.push(`⚠ High Priority: ${escalated} escalated cases require immediate admin intervention.`);
    if (pending > 15) aiSuggestions.push(`📉 Backlog Warning: ${pending} pending complaints. Workload distribution recommended.`);
    if (categoryData.length > 0) aiSuggestions.push(`ℹ Trend Alert: '${categoryData[0].name}' is the most reported issue type.`);
    if (aiSuggestions.length === 0) aiSuggestions.push("✅ System running smoothly. No critical alerts.");

    this.setState({
      totalComplaints: complaints.length,
      pending, review, escalated, resolved,
      avgResolutionTime: avgTime,
      statusData, categoryData, officerData, weeklyTrend,
      recentActivity, aiSuggestions
    });
  };

  render() {
    const { 
      totalComplaints, escalated, resolved, avgResolutionTime,
      statusData, categoryData, officerData, weeklyTrend,
      recentActivity, aiSuggestions, loading
    } = this.state;

    if (loading) return <div className="admin-loading">Loading Analytics...</div>;

    return (
      <div className="adminDash fade-in">
        <div className="admin-dash-container">
          
          {/* HEADER */}
          <div className="dash-header">
            <div>
              <h1>Admin Dashboard</h1>
              <p>Real-time insights & grievance tracking.</p>
            </div>
            <div className="header-actions">
                <span className="header-date" style={{padding:'8px 16px', backgroundColor:'rgba(255,255,255,0.9)', borderRadius:'8px', fontSize:'14px', fontWeight:'500', color:'#555'}}>
                  📅 {this.formatDate()}
                </span>
            </div>
          </div>

          {/* 1. METRIC CARDS */}
          <div className="metric-grid">
            <div className="metric-card theme-purple">
              <div className="mc-icon"><Activity size={22} /></div>
              <div className="mc-info">
                <h3>{totalComplaints}</h3>
                <span>Total Complaints</span>
              </div>
              <div className="mc-trend positive"><TrendingUp size={14}/> Live</div>
            </div>
            <div className="metric-card theme-blue">
              <div className="mc-icon"><Clock size={22} /></div>
              <div className="mc-info">
                <h3>{avgResolutionTime}d</h3>
                <span>Avg Time</span>
              </div>
            </div>
            <div className="metric-card theme-green">
              <div className="mc-icon"><CheckCircle size={22} /></div>
              <div className="mc-info">
                <h3>{resolved}</h3>
                <span>Resolved</span>
              </div>
            </div>
            <div className="metric-card theme-red">
              <div className="mc-icon"><AlertTriangle size={22} /></div>
              <div className="mc-info">
                <h3>{escalated}</h3>
                <span>Escalated</span>
              </div>
            </div>
          </div>

          {/* 2. MAIN LAYOUT */}
          <div className="dashboard-grid-layout">
            
            {/* LEFT COLUMN (Wide Content) */}
            <div className="charts-column">
              
              {/* Row 1: Status & Categories */}
              <div className="charts-row-split">
                
                {/* DOUGHNUT - Status */}
                <div className="chart-card glass-panel">
                    <div className="card-title">
                        <h4>Complaint Status</h4>
                    </div>
                    {/* Note: Height is controlled by CSS .chart-wrapper now */}
                    <div className="chart-wrapper">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={statusData} cx="50%" cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={75} /* Reduced slightly to fit legend */
                                        paddingAngle={5} dataKey="value" stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{background: 'rgba(255,255,255,0.9)', borderRadius: '10px', border:'none'}}/>
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="no-data-msg">No Data Available</div>}
                    </div>
                </div>

                {/* HORIZONTAL BAR - Categories */}
                <div className="chart-card glass-panel">
                    <div className="card-title">
                        <h4>Department Breakdown</h4>
                    </div>
                    <div className="chart-wrapper">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill:'#555'}} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '10px'}} />
                                    <Bar dataKey="count" fill="#8884d8" radius={[0, 10, 10, 0]} barSize={20}>
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={["#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e"][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="no-data-msg">No Data Available</div>}
                    </div>
                </div>
              </div>

              {/* Row 2: Trend & Officer Perf */}
              <div className="charts-row-split">
                  
                  {/* AREA CHART - Trend */}
                  <div className="chart-card glass-panel">
                      <div className="card-title">
                          <h4>Weekly Trend</h4>
                      </div>
                      <div className="chart-wrapper">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={weeklyTrend}>
                                  <defs>
                                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:11, fill:'#888'}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fill:'#888'}} />
                                  <Tooltip />
                                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* VERTICAL BAR - Officer Perf */}
                  <div className="chart-card glass-panel">
                      <div className="card-title">
                          <h4>Officer Performance</h4>
                      </div>
                      <div className="chart-wrapper">
                          {officerData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={officerData} barSize={30}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee"/>
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11}}/>
                                      <YAxis hide/>
                                      <Tooltip cursor={{fill: '#f4f4f5'}} />
                                      <Bar dataKey="resolved" fill="#10b981" radius={[10, 10, 0, 0]} />
                                  </BarChart>
                              </ResponsiveContainer>
                          ) : <div className="no-data-msg">No Resolved Complaints Yet</div>}
                      </div>
                  </div>
              </div>

              {/* RECENT COMPLAINTS FEED (Full Width - Limit 4) */}
              <div className="feed-box glass-panel full-width">
                  <div className="card-title">
                      <h4>Recent Complaints</h4>
                      <button className="action-btn-glass" style={{fontSize:'12px', padding:'5px 12px'}}>View All</button>
                  </div>
                  <div className="feed-list">
                      {recentActivity.length === 0 ? <p className="no-data-msg">No recent activity found.</p> :
                        recentActivity.map((item, i) => (
                            <div key={i} className="feed-item wide-item">
                                <div className={`feed-icon ${item.status === 'Resolved' ? 'bg-green' : 'bg-blue'}`}>
                                    {item.status === 'Resolved' ? <CheckCircle size={16}/> : <FileText size={16}/>}
                                </div>
                                <div className="feed-info-wide">
                                    <div className="feed-top">
                                        <p className="feed-id">#{item.cid || item.id}</p>
                                        <span className="feed-cat">{item.category}</span>
                                    </div>
                                    <div className="feed-bottom">
                                        <span className="feed-officer">Officer: {item.officerName || "Unassigned"}</span>
                                        <span className="feed-time">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Date N/A"}
                                        </span>
                                    </div>
                                </div>
                                <span className={`status-pill status-${(item.status || "pending").toLowerCase().replace(" ", "-")}`}>
                                    {item.status || "Pending"}
                                </span>
                                <ArrowUpRight size={16} className="feed-arrow"/>
                            </div>
                        ))
                      }
                  </div>
              </div>

            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <div className="side-column">
              
              {/* AI Insight */}
              <div className="ai-insight-box glass-panel">
                <div className="ai-header">
                  <Sparkles size={18} className="ai-sparkle" />
                  <h3>AI Insights</h3>
                </div>
                <div className="ai-content">
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="ai-item">
                        <div className="ai-dot"></div>
                        <p>{s}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    );
  }
}