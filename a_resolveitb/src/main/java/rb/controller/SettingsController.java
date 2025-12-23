package rb.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import rb.model.EscalationSetting;
import rb.rep.EscalationSettingRepository;

@RestController
@RequestMapping("/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    @Autowired
    EscalationSettingRepository repo;

    @GetMapping("/escalation-hours")
    public Map<String, Long> getEscalationHours() {
        List<EscalationSetting> all = repo.findAll();
        Map<String, Long> out = new HashMap<>();
        if (!all.isEmpty()) {
            EscalationSetting s = all.get(0);
            out.put("high", s.getHighHours());
            out.put("medium", s.getMediumHours());
            out.put("low", s.getLowHours());
        }
        return out;
    }

    @PostMapping("/escalation-hours")
    public String setEscalationHours(@RequestBody Map<String, Object> payload) {
        try {
            Long high = payload.get("high") == null ? null : Long.valueOf(payload.get("high").toString());
            Long medium = payload.get("medium") == null ? null : Long.valueOf(payload.get("medium").toString());
            Long low = payload.get("low") == null ? null : Long.valueOf(payload.get("low").toString());

            if (high == null || high <= 0 || medium == null || medium <= 0 || low == null || low <= 0)
                return "400::Invalid hours";

            List<EscalationSetting> all = repo.findAll();
            EscalationSetting s = all.isEmpty() ? new EscalationSetting() : all.get(0);
            s.setHighHours(high);
            s.setMediumHours(medium);
            s.setLowHours(low);
            repo.save(s);
            return "200::Saved";
        } catch (Exception ex) {
            return "500::" + ex.getMessage();
        }
    }
}
