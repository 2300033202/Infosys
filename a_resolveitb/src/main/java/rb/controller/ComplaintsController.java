package rb.controller;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import rb.model.Complaints;
import rb.model.ComplaintsManager;
import rb.model.JWTManager;

@RestController
@RequestMapping("/complaints")
@CrossOrigin(origins = "*")
public class ComplaintsController {

    @Autowired
    ComplaintsManager manager;

    @Autowired
    JWTManager jwt;

    // Save to uploads folder in project root (accessible and persistent)
    private final String uploadDir = "uploads/";


    /*-------------------------------------------------------
     * SUBMIT COMPLAINT
     *-------------------------------------------------------*/
    @PostMapping("/submit")
    public String submitComplaint(
            @RequestParam("type") String type,
            @RequestParam("email") String token,
            @RequestParam("category") String category,
            @RequestParam("priority") String priority,
            @RequestParam("subject") String subject,
            @RequestParam("description") String description,
            @RequestParam(value = "area", required = false) String area,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        try {
            String email = jwt.validateToken(token);
            if ("401".equals(email)) return "401::Invalid Token";

            Complaints c = new Complaints();
            c.setType(type);
            c.setCategory(category);
            c.setPriority(priority);
            c.setSubject(subject);
            c.setDescription(description);
            c.setArea(area == null ? "" : area);

            // Store ANONYMOUS for anonymous, real email for public
            c.setEmail("ANONYMOUS".equalsIgnoreCase(type) ? "ANONYMOUS" : email);
            // Always track who submitted the complaint
            c.setSubmittedBy(email);

            if (file != null && !file.isEmpty()) {
                File folder = new File(uploadDir);
                if (!folder.exists()) folder.mkdirs();

                String fileName = file.getOriginalFilename();

                Files.copy(
                        file.getInputStream(),
                        Paths.get(uploadDir + fileName),
                        StandardCopyOption.REPLACE_EXISTING
                );

                c.setAttachment(fileName);
            }

            return manager.addComplaint(c);

        } catch (Exception ex) {
            return "500::Error: " + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * USER COMPLAINT LIST
     *-------------------------------------------------------*/
    @PostMapping("/my")
    public String getMyComplaints(@RequestBody Map<String, String> data) {
        String token = data.get("csrid");
        String email = jwt.validateToken(token);
        if ("401".equals(email)) return "401::Invalid Token";
        return manager.getComplaintsByEmail(email);
    }


    /*-------------------------------------------------------
     * ADMIN — ALL COMPLAINTS
     *-------------------------------------------------------*/
    @GetMapping("/all")
    public String getAll() {
        return manager.getAllComplaints();
    }


    /*-------------------------------------------------------
     * LIST OFFICERS
     *-------------------------------------------------------*/
    @GetMapping("/officers")
    public String getOfficers() {
        return manager.getOfficers();
    }


    /*-------------------------------------------------------
     * ASSIGN OFFICER
     *-------------------------------------------------------*/
    @PostMapping("/assign")
    public String assignOfficer(@RequestBody Map<String, String> data) {
        try {
            int cid = Integer.parseInt(data.get("cid"));
            String officer = data.get("officerEmail");
            return manager.assignOfficer(cid, officer);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * UPDATE STATUS
     *-------------------------------------------------------*/
    @PostMapping("/status")
    public String updateStatus(@RequestBody Map<String, String> data) {
        try {
            int cid = Integer.parseInt(data.get("cid"));
            String status = data.get("status");
            return manager.updateStatus(cid, status);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * OFFICER — ASSIGNED COMPLAINTS
     *-------------------------------------------------------*/
    @PostMapping("/assigned")
    public String getAssignedForOfficer(@RequestBody Map<String, String> data) {
        String token = data.get("csrid");
        String email = jwt.validateToken(token);
        if ("401".equals(email)) return "401::Invalid Token";
        return manager.getComplaintsByOfficer(email);
    }


    /*-------------------------------------------------------
     * ADD OFFICER REMARK
     *-------------------------------------------------------*/
    @PostMapping("/remark")
    public String addRemark(@RequestBody Map<String, String> data) {
        try {
            int cid = Integer.parseInt(data.get("cid"));
            String remark = data.get("remark");
            return manager.addRemark(cid, remark);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * REASSIGN BACK TO ADMIN
     *-------------------------------------------------------*/
    @PostMapping("/reassign")
    public String reassign(@RequestBody Map<String, String> data) {
        try {
            int cid = Integer.parseInt(data.get("cid"));
            String remark = data.get("remark");
            return manager.reassignComplaint(cid, remark);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * RESOLVE COMPLAINT (WITH OPTIONAL FILE)
     *-------------------------------------------------------*/
    @PostMapping("/resolve")
    public String resolveComplaint(
            @RequestParam("cid") String cidStr,
            @RequestParam("remark") String remark,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "token", required = false) String token
    ) {
        try {
            if (token != null && !token.trim().isEmpty()) {
                String email = jwt.validateToken(token);
                if ("401".equals(email)) return "401::Invalid Token";
            }

            int cid = Integer.parseInt(cidStr);
            String savedFile = null;

            if (file != null && !file.isEmpty()) {
                File folder = new File(uploadDir);
                if (!folder.exists()) folder.mkdirs();

                String fileName = file.getOriginalFilename();

                Files.copy(
                        file.getInputStream(),
                        Paths.get(uploadDir + fileName),
                        StandardCopyOption.REPLACE_EXISTING
                );

                savedFile = fileName;
            }

            return manager.resolveComplaint(cid, remark, savedFile);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * SAVE USER FEEDBACK
     *-------------------------------------------------------*/
    @PostMapping("/feedback")
    public String saveFeedback(@RequestBody Map<String, Object> data) {
        try {
            Integer cid = Integer.parseInt(data.get("cid").toString());
            Integer rating = Integer.parseInt(data.get("rating").toString());
            String feedback = data.get("feedback") == null ? "" : data.get("feedback").toString();

            String email = jwt.validateToken(data.get("token").toString());
            if ("401".equals(email)) return "401::Invalid Token";

            if (rating < 1 || rating > 5) return "400::Invalid rating";

            return manager.saveUserFeedback(cid, rating, feedback, email);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * ESCALATE COMPLAINT (Option B)
     *-------------------------------------------------------*/
    @PostMapping("/escalate")
    public String escalateComplaint(@RequestBody Map<String, String> body) {
        try {
            int cid = Integer.parseInt(body.get("cid"));
            String escalatedBy = body.get("escalatedBy");
            String escalatedTo = body.get("escalatedTo");
            boolean notifyAll = Boolean.parseBoolean(body.get("notifyAll"));
            String reason = body.get("reason");

            return manager.escalateComplaint(cid, escalatedBy, escalatedTo, notifyAll, reason);

        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }


    /*-------------------------------------------------------
     * NEW — ESCALATION HISTORY (Option A)
     *-------------------------------------------------------*/
    @GetMapping("/escalation-history/{cid}")
    public String getEscalationHistory(@PathVariable int cid) {
        return manager.getEscalationHistory(cid);
    }

}
