package rb.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;

import rb.rep.ComplaintsRepository;
import rb.rep.EscalateRepository;
import rb.rep.UsersRepository;

@Service
public class ComplaintsManager {

    @Autowired
    ComplaintsRepository repo;

    @Autowired
    EscalateRepository escalateRepo;

    @Autowired
    UsersRepository usersRepo;

    @Autowired
    EmailManager emailManager;

    private final DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /*---------------------------------------------------------
     * COMMON NOTIFICATION HELPER
     *---------------------------------------------------------*/
    private void notifyParties(Complaints c, String subject, String body,
                               boolean toUser, boolean toOfficer, boolean toAdmins) {
        try {
            if (toUser && c.getEmail() != null &&
                !"ANONYMOUS".equalsIgnoreCase(c.getEmail())) {
                emailManager.sendEmail(c.getEmail(), subject, body);
            }

            if (toOfficer && c.getOfficerEmail() != null &&
                !c.getOfficerEmail().equalsIgnoreCase("Unassigned") &&
                !c.getOfficerEmail().trim().isEmpty()) {
                emailManager.sendEmail(c.getOfficerEmail(), subject, body);
            }

            if (toAdmins) {
                List<Users> admins = usersRepo.findByRole(1);
                for (Users a : admins) {
                    if (a.getEmail() != null && !a.getEmail().trim().isEmpty()) {
                        emailManager.sendEmail(a.getEmail(), subject, body);
                    }
                }
            }
        } catch (Exception ex) {
            System.err.println("Notification failed: " + ex.getMessage());
        }
    }


    /*---------------------------------------------------------
     * ADD COMPLAINT
     *---------------------------------------------------------*/
    public String addComplaint(Complaints c) {
        try {
            String now = LocalDateTime.now().format(fmt);
            c.setCreatedAt(now);

            if (c.getStatus() == null || c.getStatus().trim().isEmpty()) {
                c.setStatus("Pending");
            }

            repo.save(c);

            String summary = "Complaint #" + c.getCid() + " submitted\n" +
                    "Category: " + c.getCategory() + "\n" +
                    "Priority: " + c.getPriority() + "\n" +
                    "Status: " + c.getStatus();

            notifyParties(c,
                    "Complaint #" + c.getCid() + " submitted",
                    summary,
                    true,   // user (if not anonymous)
                    false,  // officer (not assigned yet)
                    true);  // admins
            return "200::Complaint submitted successfully";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*---------------------------------------------------------
     * USER COMPLAINT LIST — Returns only complaints filed by this user
     * (includes anonymous ones filed by this user, and all public ones)
     *---------------------------------------------------------*/
    public String getComplaintsByEmail(String email) {
        // Get public complaints from this user
        List<Complaints> list = new java.util.ArrayList<>();
        list.addAll(repo.findByEmail(email));  // Public complaints
        
        // Add anonymous complaints filed by this user (avoid duplicates)
        List<Complaints> anonList = repo.findBySubmittedBy(email);
        java.util.Set<Integer> cids = new java.util.HashSet<>();
        
        // Collect all complaint IDs from public complaints
        for (Complaints c : list) {
            cids.add(c.getCid());
        }
        
        // Add anonymous complaints that aren't already in the list
        for (Complaints c : anonList) {
            if ("ANONYMOUS".equalsIgnoreCase(c.getType()) && !cids.contains(c.getCid())) {
                list.add(c);
            }
        }
        
        for (Complaints c : list) {
            c.setAdminPrivateRemark(null);
        }
        return new Gson().toJson(list);
    }


    /*---------------------------------------------------------
     * OFFICER COMPLAINT LIST (hide admin private remarks, mask anonymous emails)
     *---------------------------------------------------------*/
    public String getComplaintsByOfficer(String officerEmail) {
        List<Complaints> list = repo.findByOfficerEmail(officerEmail);
        for (Complaints c : list) {
            c.setAdminPrivateRemark(null);
            // For officers, mask email if anonymous
            if ("ANONYMOUS".equalsIgnoreCase(c.getType())) {
                c.setEmail("ANONYMOUS");
            }
        }
        return new Gson().toJson(list);
    }


    /*---------------------------------------------------------
     * ADMIN — ALL COMPLAINTS (mask anonymous emails for display)
     *---------------------------------------------------------*/
    public String getAllComplaints() {
        List<Complaints> list = repo.findAll();
        for (Complaints c : list) {
            // For admin view, mask email if anonymous
            if ("ANONYMOUS".equalsIgnoreCase(c.getType())) {
                c.setEmail("ANONYMOUS");
            }
        }
        return new Gson().toJson(list);
    }


    /*---------------------------------------------------------
     * ASSIGN OFFICER
     *---------------------------------------------------------*/
    public String assignOfficer(int cid, String officerEmail) {
        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";

            String now = LocalDateTime.now().format(fmt);

            c.setOfficerEmail(officerEmail);
            c.setAssignedAt(now);
            c.setReviewStartedAt(now);
            c.setStatus("Under Review");

            repo.save(c);

                String summary = "Complaint #" + c.getCid() + " assigned to " + officerEmail + "\n" +
                    "Category: " + c.getCategory() + "\n" +
                    "Priority: " + c.getPriority() + "\n" +
                    "Status: " + c.getStatus();

                notifyParties(c,
                    "Complaint #" + c.getCid() + " assigned",
                    summary,
                    true,   // user
                    true,   // officer
                    true);  // admins
            return "200::Officer assigned and complaint moved to Under Review";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*---------------------------------------------------------
     * UPDATE STATUS
     *---------------------------------------------------------*/
    public String updateStatus(int cid, String status) {
        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";

            String now = LocalDateTime.now().format(fmt);
            String s = status == null ? "" : status.trim();

            if ("Under Review".equalsIgnoreCase(s)) {
                if (c.getReviewStartedAt() == null) c.setReviewStartedAt(now);
                c.setStatus("Under Review");

            } else if ("Resolved".equalsIgnoreCase(s)) {
                c.setStatus("Resolved");
                c.setResolvedAt(now);

            } else {
                c.setStatus(s);

                if ("Escalated".equalsIgnoreCase(s) && c.getReviewStartedAt() == null) {
                    c.setReviewStartedAt(now);
                }
            }

            repo.save(c);

                String summary = "Complaint #" + c.getCid() + " status updated\n" +
                    "New Status: " + c.getStatus() + "\n" +
                    "Category: " + c.getCategory() + "\n" +
                    "Priority: " + c.getPriority();

                notifyParties(c,
                    "Complaint #" + c.getCid() + " status: " + c.getStatus(),
                    summary,
                    true,   // user
                    true,   // officer
                    true);  // admins
            return "200::Status updated";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*---------------------------------------------------------
     * ADD OFFICER REMARK
     *---------------------------------------------------------*/
    public String addRemark(int cid, String remark) {
        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";

            String now = LocalDateTime.now().format(fmt);
            String entry = now + " : " + remark;

            if (c.getRemark() == null || c.getRemark().isEmpty())
                c.setRemark(entry);
            else
                c.setRemark(c.getRemark() + "\n" + entry);

            repo.save(c);
            return "200::Remark saved";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*---------------------------------------------------------
     * GET OFFICERS (role=2)
     *---------------------------------------------------------*/
    public String getOfficers() {
    return new Gson().toJson(usersRepo.findAll());
}



    /*---------------------------------------------------------
     * REASSIGN BACK TO ADMIN
     *---------------------------------------------------------*/
    public String reassignComplaint(int cid, String remark) {
        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";

            String now = LocalDateTime.now().format(fmt);
            String entry = now + " : " + remark;

            c.setOfficerEmail("Unassigned");
            // Mark as escalated so admins see it in Escalations view
            c.setStatus("Escalated");
            if (c.getReviewStartedAt() == null) {
                c.setReviewStartedAt(now);
            }

            if (c.getAdminPrivateRemark() == null)
                c.setAdminPrivateRemark(entry);
            else
                c.setAdminPrivateRemark(c.getAdminPrivateRemark() + "\n" + entry);

            repo.save(c);

            String summary = "Complaint #" + cid + " returned to Admin\n" +
                    "Reason:\n" + remark + "\nStatus: " + c.getStatus();

            notifyParties(c,
                    "Complaint #" + cid + " returned to Admin",
                    summary,
                    true,   // user
                    true,   // officer (if any)
                    true);  // admins

            return "200::Complaint returned to admin";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*---------------------------------------------------------
     * RESOLVE COMPLAINT
     *---------------------------------------------------------*/
    public String resolveComplaint(int cid, String remark, String officerAttachmentFilename) {
        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";

            String now = LocalDateTime.now().format(fmt);
            String entry = now + " : " + remark;

            if (c.getRemark() == null)
                c.setRemark(entry);
            else
                c.setRemark(c.getRemark() + "\n" + entry);

            if (officerAttachmentFilename != null)
                c.setOfficerAttachment(officerAttachmentFilename);

            c.setStatus("Resolved");
            c.setResolvedAt(now);

            repo.save(c);

            String msg = "Complaint #" + cid + " resolved\n" +
                    "Remark:\n" + remark + "\n" +
                    "Category: " + c.getCategory() + "\n" +
                    "Priority: " + c.getPriority();

            if (officerAttachmentFilename != null) {
                msg += "\nDownload Report: http://localhost:8910/uploads/" + officerAttachmentFilename;
            }

            notifyParties(c,
                    "Complaint #" + cid + " resolved",
                    msg,
                    true,   // user
                    true,   // officer
                    true);  // admins

            return "200::Complaint resolved";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }



    /*---------------------------------------------------------
     * SAVE USER FEEDBACK
     *---------------------------------------------------------*/
    public String saveUserFeedback(int cid, Integer rating, String feedbackText, String userEmail) {
        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";

            // For anonymous complaints, check submittedBy; for public, check email
            String ownerEmail = "ANONYMOUS".equalsIgnoreCase(c.getType()) ? 
                                c.getSubmittedBy() : c.getEmail();

            // Only owner can submit feedback
            if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(userEmail)) {
                return "403::You cannot submit feedback for this complaint";
            }

            c.setRating(rating);
            c.setUserFeedback(feedbackText);

            repo.save(c);
            return "200::Feedback saved";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }



    /*---------------------------------------------------------
     * OPTION A: GET ESCALATION HISTORY
     *---------------------------------------------------------*/
    public String getEscalationHistory(int cid) {
        try {
            return new Gson().toJson(escalateRepo.findByCid(cid));
        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*---------------------------------------------------------
     * OPTION B: ESCALATE COMPLAINT
     *---------------------------------------------------------*/
    public String escalateComplaint(int cid, String escalatedBy,
                                   String escalatedTo, boolean notifyAll,
                                   String reason) {

        try {
            Complaints c = repo.findById(cid).orElse(null);
            if (c == null) return "404::Complaint not found";


            // Save escalation record
            Escalate e = new Escalate();
            e.setCid(cid);
            e.setEscalatedBy(escalatedBy);
            e.setEscalatedTo(escalatedTo);
            e.setNotifyAll(notifyAll);
            e.setReason(reason);
            e.setCreatedAt(LocalDateTime.now().format(fmt));
            e.setStatus("Escalated");

            escalateRepo.save(e);


            // Update complaint status
            c.setStatus("Escalated");
            repo.save(c);


            /*---------------------------------------------------------
             * Notify the escalated officer
             *---------------------------------------------------------*/
            try {
                Users target = usersRepo.findByEmail(escalatedTo);
                if (target != null) {
                    String body =
                        "Complaint #" + cid + " was escalated to you.\n\n" +
                        "Escalated By: " + escalatedBy + "\n" +
                        "Reason:\n" + reason;

                    emailManager.sendEmail(target.getEmail(),
                            "Complaint Escalated (ID: " + cid + ")", body);
                }
            } catch (Exception ex) {
                System.out.println("Officer notify failed: " + ex.getMessage());
            }


            /*---------------------------------------------------------
             * notifyAll == TRUE → notify all admins
             *---------------------------------------------------------*/
            if (notifyAll) {
                try {
                    List<Users> admins = usersRepo.findByRole(1);
                    for (Users a : admins) {
                        String msg =
                            "Complaint #" + cid + " has been escalated.\n\n" +
                            "Escalated By: " + escalatedBy + "\n" +
                            "Escalated To: " + escalatedTo + "\n" +
                            "Reason:\n" + reason;

                        emailManager.sendEmail(a.getEmail(),
                                "Complaint Escalated #" + cid, msg);
                    }
                } catch (Exception ex) {
                    System.out.println("NotifyAll failed: " + ex.getMessage());
                }
            }


            return "200::Escalation saved & notifications sent";

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }

}
