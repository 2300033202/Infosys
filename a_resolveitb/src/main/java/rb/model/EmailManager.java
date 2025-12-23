package rb.model;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EmailManager {

    private final String brevoApiKey ="your_brevo_api_key_here";

    private final String brevoSendApiUrl = "https://api.brevo.com/v3/smtp/email";

    // ================= OTP SYSTEM ===================
    private static final int OTP_LENGTH = 6;
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final SecureRandom random = new SecureRandom();

    public String generateAndSendOTP(String email) {
        String otp = generateOTP();
        otpStorage.put(email, otp);

        scheduler.schedule(() -> otpStorage.remove(email), 5, TimeUnit.MINUTES);

        return sendEmail(email, "Your OTP Code",
                "Your OTP is: " + otp + "\nValid for 5 minutes.");
    }

    public boolean verifyOTP(String email, String otp) {
        String stored = otpStorage.get(email);
        if (stored != null && stored.equals(otp)) {
            otpStorage.remove(email);
            return true;
        }
        return false;
    }

    private String generateOTP() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    // =============== NORMAL EMAIL SEND ===============
    public String sendEmail(String toEmail, String subject, String message) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            Map<String, Object> emailData = new HashMap<>();
            Map<String, String> sender = new HashMap<>();
            sender.put("email", "bvnssathwik9894@gmail.com");
            emailData.put("sender", sender);

            List<Map<String, String>> to = new ArrayList<>();
            Map<String, String> e = new HashMap<>();
            e.put("email", toEmail);
            to.add(e);
            emailData.put("to", to);

            emailData.put("subject", subject);
            emailData.put("textContent", message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(emailData, headers);

            ResponseEntity<String> res =
                    restTemplate.postForEntity(brevoSendApiUrl, request, String.class);

            if (res.getStatusCode() == HttpStatus.OK ||
                res.getStatusCode() == HttpStatus.ACCEPTED ||
                res.getStatusCode() == HttpStatus.CREATED) {
                return "200::Email sent";
            } else {
                return "401::Failed to send email";
            }

        } catch (Exception ex) {
            return "401::" + ex.getMessage();
        }
    }
}
