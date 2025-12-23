package rb.rep;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import rb.model.Complaints;

@Repository
public interface ComplaintsRepository extends JpaRepository<Complaints, Integer> {
    List<Complaints> findByEmail(String email);
    List<Complaints> findBySubmittedBy(String submittedBy);
    List<Complaints> findByOfficerEmail(String officerEmail);
    List<Complaints> findByStatus(String status);
}
