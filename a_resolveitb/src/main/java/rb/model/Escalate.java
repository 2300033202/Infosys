package rb.model;

import jakarta.persistence.*;

@Entity
@Table(name = "complaint_escalations")
public class Escalate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int escId;

    private int cid;                // Complaint ID
    private String escalatedBy;     // Officer/Admin email
    private String escalatedTo;     // Higher authority email
    private boolean notifyAll;

    @Column(length = 2000)
    private String reason;

    private String status = "Pending";

    private String createdAt;

    // -------------------- Getters & Setters --------------------

    public int getEscId() {
        return escId;
    }

    public void setEscId(int escId) {
        this.escId = escId;
    }

    public int getCid() {
        return cid;
    }

    public void setCid(int cid) {
        this.cid = cid;
    }

    public String getEscalatedBy() {
        return escalatedBy;
    }

    public void setEscalatedBy(String escalatedBy) {
        this.escalatedBy = escalatedBy;
    }

    public String getEscalatedTo() {
        return escalatedTo;
    }

    public void setEscalatedTo(String escalatedTo) {
        this.escalatedTo = escalatedTo;
    }

    public boolean isNotifyAll() {
        return notifyAll;
    }

    public void setNotifyAll(boolean notifyAll) {
        this.notifyAll = notifyAll;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    // -------------------- toString() --------------------

    @Override
    public String toString() {
        return "Escalate{" +
                "escId=" + escId +
                ", cid=" + cid +
                ", escalatedBy='" + escalatedBy + '\'' +
                ", escalatedTo='" + escalatedTo + '\'' +
                ", notifyAll=" + notifyAll +
                ", reason='" + reason + '\'' +
                ", status='" + status + '\'' +
                ", createdAt='" + createdAt + '\'' +
                '}';
    }
}
