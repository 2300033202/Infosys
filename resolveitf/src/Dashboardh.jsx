import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { callApi } from "./api";
import "./Dashboardh.css"; 

export default function Dashboardh() {
  const [timeRange, setTimeRange] = useState("Weekly");
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [stats, setStats] = useState({
    escalated: 0,
    pending: 0,
    resolved: 0,
    avgTime: "0h"
  });
  const [loading, setLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = () => {
    setLoading(true);
    callApi("GET", "http://localhost:8910/complaints/all", "", (res) => {
      try {
        const complaints = typeof res === "string" ? JSON.parse(res) : res;
        
        // Calculate statistics
        const escalatedCount = complaints.filter(c => 
          (c.status || "").toLowerCase() === "escalated"
        ).length;
        
        const pendingCount = complaints.filter(c => 
          (c.status || "").toLowerCase() === "pending"
        ).length;
        
        const resolvedCount = complaints.filter(c => 
          (c.status || "").toLowerCase() === "resolved"
        ).length;

        // Calculate average resolution time (in hours)
        const resolvedComplaints = complaints.filter(c => 
          c.resolvedAt && c.createdAt && (c.status || "").toLowerCase() === "resolved"
        );
        
        let avgTime = "0h";
        if (resolvedComplaints.length > 0) {
          const totalTime = resolvedComplaints.reduce((sum, c) => {
            const created = new Date(c.createdAt);
            const resolved = new Date(c.resolvedAt);
            const diffMs = resolved - created;
            const diffHours = diffMs / (1000 * 60 * 60);
            return sum + diffHours;
          }, 0);
          const avgHours = (totalTime / resolvedComplaints.length).toFixed(1);
          avgTime = avgHours + "h";
        }

        setStats({
          escalated: escalatedCount,
          pending: pendingCount,
          resolved: resolvedCount,
          avgTime: avgTime
        });

        // Process bar chart data based on time range
        const chartData = processChartData(complaints, timeRange);
        setBarData(chartData);

        // Process pie chart data (priority distribution)
        const priorityData = calculatePriorityDistribution(complaints);
        setPieData(priorityData);

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      }
    });
  };

  const processChartData = (complaints, range) => {
    const now = new Date();
    let groupedData = {};

    complaints.forEach(c => {
      const createdDate = new Date(c.createdAt);
      const assigned = c.status ? 1 : 0;
      const resolved = (c.status || "").toLowerCase() === "resolved" ? 1 : 0;
      
      let key = "";
      if (range === "Weekly") {
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][createdDate.getDay()];
        key = dayName;
      } else if (range === "Monthly") {
        const weekNum = Math.ceil((createdDate.getDate()) / 7);
        key = `Week ${weekNum}`;
      } else if (range === "Yearly") {
        const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][createdDate.getMonth()];
        key = monthName;
      }

      if (!groupedData[key]) {
        groupedData[key] = { name: key, assigned: 0, resolved: 0 };
      }
      groupedData[key].assigned += assigned;
      groupedData[key].resolved += resolved;
    });

    return Object.values(groupedData).slice(0, 7);
  };

  const calculatePriorityDistribution = (complaints) => {
    const priorities = { High: 0, Medium: 0, Low: 0 };
    
    complaints.forEach(c => {
      const priority = (c.priority || "Medium").toLowerCase();
      if (priority === "high") priorities.High++;
      else if (priority === "low") priorities.Low++;
      else priorities.Medium++;
    });

    return [
      { name: "High", value: priorities.High },
      { name: "Medium", value: priorities.Medium },
      { name: "Low", value: priorities.Low }
    ];
  };

  const COLORS = ["#ef4444", "#f59e0b", "#22c55e"];

  if (loading) {
    return (
      <div className="ha-dashboard fade-in">
        <div className="ha-header">
          <h2>Higher Authority Dashboard</h2>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ha-dashboard fade-in">
      {/* HEADER */}
      <div className="ha-header">
        <h2>Higher Authority Dashboard</h2>
        <p>Review escalations, performance metrics, and trends.</p>
      </div>

      {/* STAT CARDS */}
      <div className="ha-cards">
        <div className="ha-card red">
          <h3>{stats.escalated}</h3>
          <p>Escalated</p>
        </div>
        <div className="ha-card orange">
          <h3>{stats.pending}</h3>
          <p>Pending</p>
        </div>
        <div className="ha-card green">
          <h3>{stats.resolved}</h3>
          <p>Resolved</p>
        </div>
        <div className="ha-card blue">
          <h3>{stats.avgTime}</h3>
          <p>Avg Time</p>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="ha-charts-wrapper">
        
        {/* LEFT: BAR CHART */}
        <div className="ha-chart-card">
          <div className="chart-header">
            <h4>Complaints Overview</h4>
            <div className="chart-filter">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Reduced Height to 250px */}
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 11 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888', fontSize: 11 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f9f9f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}/>
                <Bar 
                  dataKey="assigned" 
                  name="Assigned" 
                  fill="#4f46e5" 
                  radius={[3, 3, 0, 0]} 
                  barSize={15}
                />
                <Bar 
                  dataKey="resolved" 
                  name="Resolved" 
                  fill="#22c55e" 
                  radius={[3, 3, 0, 0]} 
                  barSize={15}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: PIE CHART */}
        <div className="ha-chart-card">
          <div className="chart-header">
            <h4>Priority Distribution</h4>
          </div>

          {/* Reduced Height to 250px */}
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}