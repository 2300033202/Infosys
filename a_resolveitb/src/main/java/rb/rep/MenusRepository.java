package rb.rep;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import rb.model.Menus;

@Repository
public interface MenusRepository extends JpaRepository<Menus, Long>
{
	@Query("Select M from Menus M join Roles R on M.mid=R.menus.mid where R.role=:role")
	public List<Menus> findbyRole(@Param("role") int role);

}
