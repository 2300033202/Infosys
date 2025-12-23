package rb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "complaints")
public class Complaints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cid")
    private int cid;

    @Column(name = "type")
    private String type;   // PUBLIC / ANONYMOUS

    @Column(name = "email")
    private String email;  // user email for PUBLIC, "ANONYMOUS" for anonymous

    @Column(name = "submitted_by")
    private String submittedBy;  // Real email of who filed (used to link anonymous to owner)

    @Column(name = "category")
    private String category;

    @Column(name = "priority")
    private String priority;

    @Column(name = "subject")
    private String subject;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "attachment")
    private String attachment;

    // officer uploaded report/attachment filename
    @Column(name = "officer_attachment")
    private String officerAttachment;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "status")
    private String status; // Pending, Under Review, Escalated, Resolved

    @Column(name = "officer_email")
    private String officerEmail; // assigned officer's email

    @Column(name = "area")
    private String area; // Ward 1 / Ward 2 etc.

    @Column(name = "remark", columnDefinition = "LONGTEXT")
    private String remark; // officer remarks / updates (visible to user/officer)

    // Admin-only private remarks
    @Column(name = "admin_private_remark", columnDefinition = "LONGTEXT")
    private String adminPrivateRemark;

    // NEW: user rating (1..5)
    @Column(name = "rating")
    private Integer rating;

    // NEW: user feedback text
    @Column(name = "user_feedback", columnDefinition = "LONGTEXT")
    private String userFeedback;

    // NEW TIMESTAMPS
    @Column(name = "assigned_at")
    private String assignedAt;

    @Column(name = "review_started_at")
    private String reviewStartedAt;

    @Column(name = "resolved_at")
    private String resolvedAt;

    // Getters / Setters

    public int getCid() { return cid; }
    public void setCid(int cid) { this.cid = cid; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAttachment() { return attachment; }
    public void setAttachment(String attachment) { this.attachment = attachment; }

    public String getOfficerAttachment() { return officerAttachment; }
    public void setOfficerAttachment(String officerAttachment) { this.officerAttachment = officerAttachment; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOfficerEmail() { return officerEmail; }
    public void setOfficerEmail(String officerEmail) { this.officerEmail = officerEmail; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public String getAdminPrivateRemark() { return adminPrivateRemark; }
    public void setAdminPrivateRemark(String adminPrivateRemark) { this.adminPrivateRemark = adminPrivateRemark; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getUserFeedback() { return userFeedback; }
    public void setUserFeedback(String userFeedback) { this.userFeedback = userFeedback; }

    public String getAssignedAt() { return assignedAt; }
    public void setAssignedAt(String assignedAt) { this.assignedAt = assignedAt; }

    public String getReviewStartedAt() { return reviewStartedAt; }
    public void setReviewStartedAt(String reviewStartedAt) { this.reviewStartedAt = reviewStartedAt; }

    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }

    @Override
    public String toString() {
        return "Complaints{" +
                "cid=" + cid +
                ", type='" + type + '\'' +
                ", email='" + email + '\'' +
                ", submittedBy='" + submittedBy + '\'' +
                ", category='" + category + '\'' +
                ", priority='" + priority + '\'' +
                ", subject='" + subject + '\'' +
                ", description='" + description + '\'' +
                ", attachment='" + attachment + '\'' +
                ", officerAttachment='" + officerAttachment + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", status='" + status + '\'' +
                ", officerEmail='" + officerEmail + '\'' +
                ", area='" + area + '\'' +
                ", remark='" + remark + '\'' +
                ", adminPrivateRemark='" + adminPrivateRemark + '\'' +
                ", rating='" + rating + '\'' +
                ", userFeedback='" + userFeedback + '\'' +
                ", assignedAt='" + assignedAt + '\'' +
                ", reviewStartedAt='" + reviewStartedAt + '\'' +
                ", resolvedAt='" + resolvedAt + '\'' +
                '}';
    }
}
