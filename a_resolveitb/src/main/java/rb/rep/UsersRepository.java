package rb.rep;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import rb.model.Users;

@Repository
public interface UsersRepository extends JpaRepository<Users, String> {

    @Query("select count(U) from Users U where U.email=:email")
    int validateEmail(@Param("email") String email);

    @Query("select count(U) from Users U where U.email=:email and U.password=:password")
    int validatecredentials(@Param("email") String email,
                            @Param("password") String password);

    @Query("select U from Users U where U.role = :role")
    List<Users> findByRole(@Param("role") int role);

    @Query("select U.blocked from Users U where U.email=:email")
    boolean isBlocked(@Param("email") String email);

    Users findByEmail(String email);
}


