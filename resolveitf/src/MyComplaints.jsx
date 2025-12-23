import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FaRegClock,
  FaSearch,
  FaCheckCircle,
  FaArrowLeft,
  FaStar,
  FaPaperclip,
  FaFileAlt,
  FaExclamationCircle,
  FaCheck,
  FaCommentDots,
  FaDownload,
  FaFileCsv,
  FaFilePdf
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getSession } from "./api"; // Preserving your existing API import

const API_BASE_URL = "http://localhost:8910";

/* ===========================
   HELPER FUNCTIONS
   =========================== */
const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function MyComplaints() {
  const [complaintsList, setComplaintsList] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = () => {
    const token = getSession("csrid");
    if (!token) return;

    fetch(`${API_BASE_URL}/complaints/my`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrid: token })
    })
      .then((r) => r.text())
      .then((text) => {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            // Sort by date - newest first
            const sorted = data.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA; // Descending order (newest first)
            });
            setComplaintsList(sorted);
          } else {
            setComplaintsList([]);
          }
        } catch {
          setComplaintsList([]);
        }
      });
  };

  const updateComplaint = (updated) => {
    setComplaintsList((prev) =>
      prev.map((c) => (c.cid === updated.cid ? updated : c))
    );
    setSelectedComplaint(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  /* ===========================
     EXPORT FUNCTIONS
     =========================== */

  const downloadPDF = () => {
    if (complaintsList.length === 0) return alert("No complaints to export.");
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(18);
    doc.setTextColor(88, 28, 135); // Purple color
    doc.text("My Grievance Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);

    const tableBody = complaintsList.map((c) => [
      c.cid,
      c.subject,
      c.category,
      c.priority,
      c.status,
      formatDate(c.createdAt),
      c.area || "-",
      (c.remark || "").replace(/\n/g, " | ")
    ]);

    autoTable(doc, {
      startY: 30,
      head: [
        ["CID", "Subject", "Category", "Priority", "Status", "Date", "Area", "Remarks"]
      ],
      body: tableBody,
      headStyles: { fillColor: [147, 51, 234] }, // Purple Header
      styles: { fontSize: 9 },
    });

    doc.save("My_Grievances.pdf");
  };

  const downloadCSV = () => {
    if (complaintsList.length === 0) return alert("No complaints to export.");
    const headers = ["CID", "Subject", "Description", "Category", "Priority", "Status", "Date", "Remarks"];
    const rows = [headers.join(",")];

    complaintsList.forEach((c) => {
      const row = [
        c.cid,
        `"${(c.subject || "").replace(/"/g, '""')}"`,
        `"${(c.description || "").replace(/"/g, '""')}"`,
        c.category,
        c.priority,
        c.status,
        c.createdAt,
        `"${(c.remark || "").replace(/"/g, '""').replace(/\n/g, " ")}"`
      ];
      rows.push(row.join(","));
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "My_Grievances.csv";
    a.click();
  };

  /* ===========================
     RENDER
     =========================== */
  return (
    <>
      <style>{`
        /* Use the Google Fonts provided */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap');

        /* GLOBAL & BACKGROUND */
        body { margin: 0; font-family: 'Poppins', sans-serif; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        body::-webkit-scrollbar { display: none; }
        body { -ms-overflow-style: none; scrollbar-width: none; }

        .mc-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #fdf4ff 0%, #f5e8ff 50%, #eef2ff 100%);
          padding-bottom: 100px;
          padding-top: 40px;
        }

        .mc-center-box {
          max-width: 700px;
          width: 90vw;
          margin: 0 auto;
          padding: 0 15px;
        }

        .mc-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          text-align: center;
          background: linear-gradient(90deg, #3b82f6 0%, #d946ef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
        }

        /* Action Bar for Downloads */
        .mc-action-bar {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
        }

        .mc-btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 2px solid #e9d5ff;
          color: #9333ea;
          padding: 8px 20px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(233, 213, 255, 0.4);
        }
        
        .mc-btn-export:hover {
          background: #9333ea;
          color: white;
          border-color: #9333ea;
          box-shadow: 0 6px 15px rgba(147, 51, 234, 0.3);
          transform: translateY(-2px);
        }

        /* Card Styles */
        .mc-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 20px 24px;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(235, 200, 255, 0.4);
          border: 1px solid #f8f0fc;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mc-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(216, 180, 254, 0.5);
        }

        .mc-info-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        
        /* Pills */
        .mc-status-pill { 
          padding: 5px 12px; border-radius: 12px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .status-resolved { background: #dcfce7; color: #15803d; }
        .status-review { background: #fef9c3; color: #a16207; }
        .status-submitted { background: #e0f2fe; color: #0369a1; }
        .status-rejected { background: #fee2e2; color: #b91c1c; }

        .mc-priority-pill { padding: 4px 10px; border-radius: 8px; font-weight: 600; font-size: 0.75rem; }
        .prio-High { background: #fee2e2; color: #b91c1c; }
        .prio-Medium { background: #ffedd5; color: #c2410c; }
        .prio-Low { background: #f3f4f6; color: #4b5563; }
        .mc-category-tag { background: #fef3c7; color: #92400e; font-weight: 700; font-size: 0.75rem; padding: 4px 10px; border-radius: 8px; }

        .mc-desc { font-size: 0.95rem; color: #4b5563; line-height: 1.6; margin-top: 12px; }

        /* Detail View Styles */
        .mc-detail-card { background: #fff; border-radius: 24px; padding: 30px; box-shadow: 0 10px 40px rgba(200, 180, 255, 0.25); }
        .mc-back-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white; border: none; padding: 12px 24px; border-radius: 12px; 
          font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 25px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          transition: transform 0.2s;
        }
        .mc-back-btn:hover { transform: translateY(-2px); }

        .mc-status-box { text-align: center; background: #faf5ff; border: 2px solid #f3e8ff; border-radius: 18px; padding: 25px; margin-bottom: 25px; }
        .mc-status-main { font-size: 2.2rem; font-weight: 800; color: #6b21a8; margin: 10px 0; }
        
        .mc-progress-track { width: 100%; height: 14px; background: #e9d5ff; border-radius: 14px; margin: 20px 0; overflow: hidden; }
        .mc-progress-fill { height: 100%; background: linear-gradient(90deg, #a855f7, #d946ef); border-radius: 14px; transition: width 0.8s ease-out; }

        .mc-timeline { margin-top: 30px; display: flex; flex-direction: column; gap: 20px; }
        .mc-step { display: flex; gap: 15px; position: relative; }
        .mc-step-icon { 
          width: 40px; height: 40px; border-radius: 50%; background: #f3e8ff; color: #c084fc; 
          display: flex; align-items: center; justify-content: center; font-size: 1.2rem; z-index: 2; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
        }
        .mc-step-icon.active { background: #d946ef; color: white; box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4); }
        .mc-step-line { position: absolute; left: 18px; top: 40px; bottom: -25px; width: 3px; background: #e9d5ff; z-index: 0; }
        .mc-step:last-child .mc-step-line { display: none; }
        
        .mc-feedback-box { background: #fffbeb; border: 1px dashed #f59e0b; padding: 20px; border-radius: 16px; text-align: center; margin-top: 30px; }
        
        /* Success Toast */
        .success-badge {
            position: fixed; bottom: 30px; right: 30px; background: #10b981; color: white;
            padding: 16px 24px; border-radius: 12px; font-weight: 600; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
            display: flex; align-items: center; gap: 10px; z-index: 1000;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .mc-center-box { max-width: 95vw; margin: 0 auto; }
          .mc-title { font-size: 1.6rem; }
          .mc-status-main { font-size: 1.8rem; }
        }
      `}</style>

      <div className="mc-bg">
        <div className="mc-center-box">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mc-title"
          >
            {selectedComplaint ? "Complaint Details" : "My Grievances"}
          </motion.h1>

          {/* Top Actions: Only show on List View */}
          {!selectedComplaint && (
            <motion.div 
              className="mc-action-bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button 
                className="mc-btn-export" 
                onClick={downloadCSV}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaFileCsv size={16} /> Export CSV
              </motion.button>
              <motion.button 
                className="mc-btn-export" 
                onClick={downloadPDF}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaFilePdf size={16} /> Export PDF
              </motion.button>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {selectedComplaint ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <ComplaintDetail
                  complaint={selectedComplaint}
                  onBack={() => setSelectedComplaint(null)}
                  onUpdate={updateComplaint}
                />
              </motion.div>
            ) : (
              <motion.div key="list">
                {complaintsList.length === 0 ? (
                  <motion.div 
                    className="mc-card" 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: "center", padding: "60px 20px" }}
                  >
                    <FaExclamationCircle size={50} color="#e9d5ff" />
                    <h3 style={{ color: "#a855f7", marginTop: 15 }}>No Grievances Found</h3>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>You haven't submitted any complaints yet.</p>
                  </motion.div>
                ) : (
                  complaintsList.map((c, i) => (
                    <motion.div
                      key={c.cid || i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedComplaint(c)}
                    >
                      <ComplaintCard complaint={c} />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="success-badge"
          >
            <FaCheckCircle size={20} /> Success! Data updated.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ===========================
   COMPONENTS
   =========================== */

const ComplaintCard = ({ complaint }) => {
  const [expanded, setExpanded] = useState(false);
  const desc = complaint.description || "";
  const shortDesc = desc.length > 120 ? desc.slice(0, 120) + "..." : desc;

  // Helper to determine status style
  const getStatusClass = (s) => {
    if (!s) return "status-submitted";
    const lower = s.toLowerCase();
    if (lower.includes("resolved")) return "status-resolved";
    if (lower.includes("review") || lower.includes("progress")) return "status-review";
    if (lower.includes("rejected")) return "status-rejected";
    return "status-submitted";
  };

  return (
    <div className="mc-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ margin: "0 0 5px 0", color: "#1f2937", fontSize: "1.1rem" }}>{complaint.subject}</h3>
        <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>
           {formatDate(complaint.createdAt).split(",")[0]}
        </span>
      </div>

      <div className="mc-info-row">
        <span className={`mc-status-pill ${getStatusClass(complaint.status)}`}>
          {complaint.status || "Submitted"}
        </span>
        <span className={`mc-priority-pill prio-${complaint.priority}`}>
          {complaint.priority}
        </span>
        <span className="mc-category-tag">{complaint.category}</span>
      </div>

      <p className="mc-desc">
        {expanded ? desc : shortDesc}
        {desc.length > 120 && (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ color: "#9333ea", fontWeight: 700, cursor: "pointer", marginLeft: 6 }}
          >
            {expanded ? "Less" : "More"}
          </span>
        )}
      </p>
      
      {/* Show attachments indicators in card view */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {complaint.attachment && (
          <span style={{ fontSize: '0.75rem', color: '#0891b2', background: '#ecfeff', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <FaPaperclip size={10} /> Attachment
          </span>
        )}
        {complaint.officerAttachment && (
          <span style={{ fontSize: '0.75rem', color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <FaFileAlt size={10} /> Proof
          </span>
        )}
      </div>
    </div>
  );
};

const ComplaintDetail = ({ complaint, onBack, onUpdate }) => {
  const [rating, setRating] = useState(complaint.rating || 0);
  const [feedback, setFeedback] = useState(complaint.userFeedback || "");
  const [editing, setEditing] = useState(!complaint.rating);
  const [loading, setLoading] = useState(false);

  // Status Logic
  const status = (complaint.status || "").toLowerCase();
  const step = status.includes("resolved") ? 2 : status.includes("review") ? 1 : 0;
  
  const submitFeedback = async () => {
    if (rating === 0) return alert("Please select a rating");
    setLoading(true);
    try {
      const token = getSession("csrid");
      // Simulate API call
      const res = await fetch(`${API_BASE_URL}/complaints/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: complaint.cid, rating, feedback, token })
      });
      // Assuming success for demo
      onUpdate({ ...complaint, rating, userFeedback: feedback });
      setEditing(false);
    } catch {
      alert("Failed to save feedback");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: "Submitted", date: complaint.createdAt, icon: <FaRegClock /> },
    { label: "Under Review", date: complaint.assignedAt || complaint.reviewStartedAt, icon: <FaSearch /> },
    { label: "Resolved", date: complaint.resolvedAt, icon: <FaCheck /> },
  ];

  return (
    <div className="mc-detail-card">
      <motion.button 
        className="mc-back-btn" 
        onClick={onBack}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FaArrowLeft /> Back
      </motion.button>

      {/* Main Status Box - UPDATED to Percentage Style */}
      <div className="mc-status-box">
        <div style={{ textTransform: "uppercase", fontSize: "0.85rem", fontWeight: 700, color: "#a855f7", marginBottom: 5 }}>
          Current Status
        </div>
        
        {/* Large Status Text */}
        <div className="mc-status-main" style={{ fontSize: '2.5rem' }}>{complaint.status}</div>
        
        {/* Progress Bar */}
        <div className="mc-progress-track">
          <div className="mc-progress-fill" style={{ width: `${(step + 1) * 33.33}%` }}></div>
        </div>

        {/* Percentage Text (Replacing the labels) */}
        <div style={{ color: '#9333ea', fontWeight: 700, fontSize: '1.1rem', marginTop: '15px' }}>
          {step === 0 && "33% Complete"}
          {step === 1 && "66% Complete"}
          {step === 2 && "100% Complete"}
        </div>
      </div>

      {/* Timeline */}
      <div className="mc-timeline">
        {steps.map((s, i) => {
           const isActive = i <= step;
           return (
             <div key={i} className="mc-step">
                {i !== steps.length - 1 && <div className="mc-step-line" style={{ background: isActive ? '#d946ef' : '#e9d5ff' }}></div>}
                <div className={`mc-step-icon ${isActive ? 'active' : ''}`}>
                   {s.icon}
                </div>
                <div>
                   <div style={{ fontWeight: 700, color: isActive ? '#4b5563' : '#9ca3af' }}>{s.label}</div>
                   <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{formatDate(s.date)}</div>
                </div>
             </div>
           );
        })}
      </div>

      {/* Remarks Section */}
      <div style={{ marginTop: 30, background: '#f8fafc', padding: 20, borderRadius: 16 }}>
         <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCommentDots color="#3b82f6"/> Officer Remarks
         </h4>
         {complaint.remark ? (
            <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
               {complaint.remark}
            </div>
         ) : (
            <div style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.9rem' }}>No remarks yet.</div>
         )}
      </div>

      {/* Attachments Section */}
      <div style={{ marginTop: 25, background: '#fefce8', padding: 20, borderRadius: 16, border: '1px solid #fef08a' }}>
         <h4 style={{ margin: '0 0 15px 0', color: '#713f12', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaDownload color="#ca8a04" /> Attachments & Documents
         </h4>
         <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
           {complaint.attachment && (
              <a href={`${API_BASE_URL}/uploads/${complaint.attachment}`} target="_blank" rel="noreferrer" 
                 style={{ textDecoration: 'none', background: '#ecfeff', color: '#0891b2', padding: '12px 18px', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '2px solid #06b6d4', boxShadow: '0 2px 8px rgba(6, 182, 212, 0.2)' }}>
                 <FaPaperclip size={16} /> View My Attachment
              </a>
           )}
           {complaint.officerAttachment && (
              <a href={`${API_BASE_URL}/uploads/${complaint.officerAttachment}`} target="_blank" rel="noreferrer"
                 style={{ textDecoration: 'none', background: '#f0fdf4', color: '#16a34a', padding: '12px 18px', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '2px solid #22c55e', boxShadow: '0 2px 8px rgba(34, 197, 94, 0.2)' }}>
                 <FaFileAlt size={16} /> Officer Resolution Proof
              </a>
           )}
           {!complaint.attachment && !complaint.officerAttachment && (
              <div style={{ color: '#a16207', fontSize: '0.9rem', fontStyle: 'italic' }}>No attachments available</div>
           )}
         </div>
      </div>

      {/* Feedback Section (Only if Resolved) */}
      {status.includes("resolved") && (
        <div className="mc-feedback-box">
           <h3 style={{ color: '#b45309', margin: '0 0 15px 0' }}>How was the service?</h3>
           
           {!editing ? (
             <div>
                 <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 10 }}>
                    {[1,2,3,4,5].map(star => (
                       <FaStar key={star} color={star <= rating ? "#f59e0b" : "#e5e7eb"} size={24} />
                    ))}
                 </div>
                 {feedback && <p style={{ fontStyle: 'italic', color: '#78350f' }}>"{feedback}"</p>}
                 <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', textDecoration: 'underline', color: '#b45309', cursor: 'pointer', fontWeight: 600 }}>Edit Feedback</button>
             </div>
           ) : (
             <div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 15 }}>
                    {[1,2,3,4,5].map(star => (
                       <FaStar key={star} color={star <= rating ? "#f59e0b" : "#d1d5db"} size={32} 
                               style={{ cursor: 'pointer', transition: 'transform 0.2s' }} 
                               onClick={() => setRating(star)} 
                               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    ))}
                </div>
                <textarea 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe your experience..."
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #fcd34d', fontFamily: 'inherit', marginBottom: 15 }}
                  rows={3}
                />
                <button 
                  onClick={submitFeedback} disabled={loading}
                  style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                   {loading ? "Submitting..." : "Submit Feedback"}
                </button>
             </div>
           )}
        </div>
      )}

    </div>
  );
};