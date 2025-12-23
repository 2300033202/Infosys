package rb.rep;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import rb.model.Escalate;

@Repository
public interface EscalateRepository extends JpaRepository<Escalate, Integer> {

    // Get all escalations for one complaint
    List<Escalate> findByCid(int cid);
}
