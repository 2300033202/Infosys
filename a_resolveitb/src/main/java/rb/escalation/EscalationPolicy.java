package rb.escalation;

import java.util.HashMap;
import java.util.Map;

public class EscalationPolicy {

    private static final Map<String, Long> HOURS = new HashMap<>();

    static {
        HOURS.put("HIGH", 6L);     // hours
        HOURS.put("MEDIUM", 25L);
        HOURS.put("LOW", 50L);
    }

    public static Long getHours(String priority) {
        if (priority == null) return null;
        return HOURS.get(priority.toUpperCase());
    }
}
