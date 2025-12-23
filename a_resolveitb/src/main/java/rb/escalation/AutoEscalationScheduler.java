package rb.escalation;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AutoEscalationScheduler {

    @Autowired
    AutoEscalationService service;

    // 🔁 Runs every 15 minutes
    @Scheduled(fixedRate = 15 * 60 * 1000)
    public void checkEscalation() {
        service.runAutoEscalation();
    }
}
