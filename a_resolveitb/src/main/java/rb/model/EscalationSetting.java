package rb.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "escalation_setting")
public class EscalationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Priority-specific auto-escalation time in HOURS
    @Column(name = "high_hours")
    private Long highHours;

    @Column(name = "medium_hours")
    private Long mediumHours;

    @Column(name = "low_hours")
    private Long lowHours;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHighHours() { return highHours; }
    public void setHighHours(Long highHours) { this.highHours = highHours; }

    public Long getMediumHours() { return mediumHours; }
    public void setMediumHours(Long mediumHours) { this.mediumHours = mediumHours; }

    public Long getLowHours() { return lowHours; }
    public void setLowHours(Long lowHours) { this.lowHours = lowHours; }
}
