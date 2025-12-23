package rb.rep;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import rb.model.EscalationSetting;

@Repository
public interface EscalationSettingRepository extends JpaRepository<EscalationSetting, Long> {
}
