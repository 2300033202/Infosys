package rb.escalation;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import rb.model.Complaints;
import rb.model.EmailManager;
import rb.model.Escalate;
import rb.model.Users;
import rb.rep.ComplaintsRepository;
import rb.rep.EscalateRepository;
import rb.rep.UsersRepository;

@Service
public class AutoEscalationService {

    @Autowired
    ComplaintsRepository complaintsRepo;

    @Autowired
    EscalateRepository escalateRepo;

    @Autowired
    UsersRepository usersRepo;

    @Autowired
    EmailManager emailManager;

    @Autowired
    rb.rep.EscalationSettingRepository settingsRepo;

    private final DateTimeFormatter fmt =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // 🔥 This method does everything
    public void runAutoEscalation() {

        System.out.println("⏱ AUTO ESCALATION CHECK RUNNING...");

        List<Complaints> complaints = complaintsRepo.findAll();

        for (Complaints c : complaints) {

            // Skip resolved or already escalated
            if ("Resolved".equalsIgnoreCase(c.getStatus()) ||
                "Escalated".equalsIgnoreCase(c.getStatus())) {
                continue;
            }

            // Prefer priority-specific global setting if present, else fallback to policy
            Long limitHours = null;
            try {
                var all = settingsRepo.findAll();
                if (!all.isEmpty()) {
                    var s = all.get(0);
                    String pr = c.getPriority() == null ? "" : c.getPriority().trim().toUpperCase();
                    if ("HIGH".equals(pr) && s.getHighHours() != null && s.getHighHours() > 0) {
                        limitHours = s.getHighHours();
                    } else if ("MEDIUM".equals(pr) && s.getMediumHours() != null && s.getMediumHours() > 0) {
                        limitHours = s.getMediumHours();
                    } else if ("LOW".equals(pr) && s.getLowHours() != null && s.getLowHours() > 0) {
                        limitHours = s.getLowHours();
                    }
                }
            } catch (Exception ignored) {}
            if (limitHours == null) {
                limitHours = EscalationPolicy.getHours(c.getPriority());
            }
            if (limitHours == null) continue;

            // Time reference
            String baseTime =
                    c.getReviewStartedAt() != null
                            ? c.getReviewStartedAt()
                            : c.getCreatedAt();

            if (baseTime == null) continue;

            LocalDateTime startTime =
                    LocalDateTime.parse(baseTime, fmt);

            long elapsedHours =
                    Duration.between(startTime, LocalDateTime.now()).toHours();

            if (elapsedHours >= limitHours) {
                autoEscalate(c, elapsedHours);
            }
        }
    }

    // 🔥 Escalation action
    private void autoEscalate(Complaints c, long hours) {

        System.out.println("🚨 AUTO ESCALATING CID = " + c.getCid());

        // Save escalation history
        Escalate e = new Escalate();
        e.setCid(c.getCid());
        e.setEscalatedBy("SYSTEM");
        e.setEscalatedTo("ALL_ADMINS");
        e.setNotifyAll(true);
        e.setReason("Auto escalated after " + hours + " hours due to time limit breach");
        e.setStatus("Escalated");
        e.setCreatedAt(LocalDateTime.now().format(fmt));

        escalateRepo.save(e);

        // Update complaint
        c.setStatus("Escalated");
        complaintsRepo.save(c);

        String emailBody = "Complaint #" + c.getCid() + " has been auto-escalated.\n\n" +
                "Subject: " + c.getSubject() + "\n" +
                "Category: " + c.getCategory() + "\n" +
                "Priority: " + c.getPriority() + "\n" +
                "Elapsed Time: " + hours + " hours\n" +
                "Time Limit: " + EscalationPolicy.getHours(c.getPriority()) + " hours\n\n" +
                "Reason: Exceeded maximum response time for " + c.getPriority() + " priority complaints.";

        // 1. Notify admins
        try {
            List<Users> admins = usersRepo.findByRole(1);
            for (Users a : admins) {
                emailManager.sendEmail(
                        a.getEmail(),
                        "🚨 AUTO ESCALATION | Complaint #" + c.getCid(),
                        emailBody
                );
            }
        } catch (Exception ex) {
            System.err.println("Admin email failed: " + ex.getMessage());
        }

        // 2. Notify the assigned officer (if any)
        try {
            if (c.getOfficerEmail() != null && 
                !c.getOfficerEmail().equalsIgnoreCase("Unassigned") &&
                !c.getOfficerEmail().trim().isEmpty()) {
                
                String officerMsg = "Your assigned complaint #" + c.getCid() + 
                        " has been auto-escalated to higher authorities.\n\n" +
                        "Subject: " + c.getSubject() + "\n" +
                        "Priority: " + c.getPriority() + "\n" +
                        "Time Elapsed: " + hours + " hours\n\n" +
                        "The complaint exceeded the maximum resolution time and has been escalated for urgent attention.";
                
                emailManager.sendEmail(
                        c.getOfficerEmail(),
                        "⚠ Complaint #" + c.getCid() + " Auto-Escalated",
                        officerMsg
                );
            }
        } catch (Exception ex) {
            System.err.println("Officer email failed: " + ex.getMessage());
        }

        // 3. Notify the citizen/user (if not anonymous)
        try {
            if (c.getEmail() != null && 
                !"ANONYMOUS".equalsIgnoreCase(c.getEmail()) &&
                !c.getEmail().trim().isEmpty()) {
                
                String userMsg = "Your complaint #" + c.getCid() + 
                        " has been escalated to higher authorities for faster resolution.\n\n" +
                        "Subject: " + c.getSubject() + "\n" +
                        "Priority: " + c.getPriority() + "\n\n" +
                        "Your complaint is receiving priority attention and will be addressed by senior officials.";
                
                emailManager.sendEmail(
                        c.getEmail(),
                        "Update: Complaint #" + c.getCid() + " Escalated",
                        userMsg
                );
            }
        } catch (Exception ex) {
            System.err.println("User email failed: " + ex.getMessage());
        }
    }
}
