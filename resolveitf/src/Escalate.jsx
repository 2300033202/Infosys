// Escalate.jsx — Escalated Complaints List
import React, { useState } from "react";
import "./Escalate.css";

export default function Escalate({ complaints, onClose, fetchHistory, openEscalateFormFor }) {
  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCid, setSelectedCid] = useState(null);

  const loadHistory = (cid) => {
    setLoading(true);
    fetchHistory(cid, (err, data) => {
      setLoading(false);
      if (!err) {
        setSelectedCid(cid);
        setHistoryList(data);
        setShowHistory(true);
      }
    });
  };

  return (
    <div className="escList-overlay" onClick={onClose}>
      <div className="escList-modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="escList-title">⚠ Escalated Complaints</h2>

        {/* ================= TABLE ================= */}
        <table className="escList-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>User</th>
              <th>Officer</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {complaints.length === 0 && (
              <tr>
                <td colSpan="6" className="escList-empty">No Escalated Complaints</td>
              </tr>
            )}

            {complaints.map((c) => (
              <tr key={c.cid}>
                <td>#CMP{c.cid}</td>
                <td>{c.subject}</td>
                <td>{c.email}</td>
                <td>{c.officerEmail || "None"}</td>
                <td>{c.createdAt?.split(" ")[0]}</td>

                <td className="escList-actions">
                  <button
                    className="escList-btn-blue"
                    onClick={() => loadHistory(c.cid)}
                  >
                    📜 History
                  </button>

                  <button
                    className="escList-btn-orange"
                    onClick={() => openEscalateFormFor(c)}
                  >
                    ⚠ Re-Escalate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================= HISTORY MODAL ================= */}
        {showHistory && (
          <div className="history-overlay" onClick={() => setShowHistory(false)}>
            <div className="history-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="history-title">Escalation History — CMP{selectedCid}</h3>

              {loading && <p>Loading...</p>}

              {historyList.length === 0 ? (
                <p>No escalation records found.</p>
              ) : (
                <ul className="history-list">
                  {historyList.map((h, i) => (
                    <li key={i} className="history-item">
                      <b>{h.createdAt}</b> — {h.reason}
                      <br />
                      <span className="history-meta">
                        By: {h.escalatedBy} → {h.escalatedTo}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <button className="history-close">Close</button>
            </div>
          </div>
        )}

        <button className="escList-close">Close</button>
      </div>
    </div>
  );
}
