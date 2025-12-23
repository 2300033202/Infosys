package rb.model;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import rb.rep.UsersRepository;

@Service
public class UsersManager {

    @Autowired
    UsersRepository UR;

    @Autowired
    EmailManager EM;

    @Autowired
    JWTManager JWT;

    /* SIGNUP */
    public String addUsers(Users U) {

        if (U.getEmail() == null || U.getEmail().trim().isEmpty()) {
            return "401::Email is required";
        }
        if (UR.validateEmail(U.getEmail()) > 0) {
            return "401::Email Id already exists";
        }

        // Role rules
        if (U.getRole() == 2 && (U.getDepartment() == null || U.getDepartment().trim().isEmpty())) {
            return "401::Department required for officer role";
        }

        if (U.getRole() == 1) {          // Admin
    U.setDepartment("All");
}
else if (U.getRole() == 2) {     // Officer
    // department already validated
}
else if (U.getRole() == 3) {     // User
    U.setDepartment("-");
}
else if (U.getRole() == 4) {     // 🔥 Higher Authority
    U.setDepartment("All");
}


        // ensure default availability
        if (U.getAvailabilityStatus() == null || U.getAvailabilityStatus().isEmpty()) {
            U.setAvailabilityStatus("ACTIVE");
        }

        UR.save(U);
        return "200::User Registered Successfully";
    }

    /* LOGIN (now checks BLOCKED status) */
    public String validateCredentials(String email, String password) {

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "401::Invalid Credentials";

        if (Boolean.TRUE.equals(u.getBlocked()))
            return "401::Your account has been blocked by admin";

        if (!u.getPassword().equals(password))
            return "401::Invalid Credentials";

        return "200::" + JWT.generateToken(email);
    }

    /* UPDATE PROFILE */
    public String updateProfile(String token, String phone, String address, String photo) {

        String email = JWT.validateToken(token);
        if (email.equals("401"))
            return "401::Invalid Token";

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        if (phone != null) u.setPhone(phone);
        if (address != null) u.setAddress(address);
        if (photo != null) u.setPhoto(photo);

        UR.save(u);
        return "200::Profile Updated Successfully";
    }

    /* FORGOT PASSWORD (old functionality) */
    public String recoverPassword(String email) {
        Users U = UR.findById(email).orElse(null);
        if (U == null) return "404::User not found";

        String msg = "Dear " + U.getFullname() + "\n\nYour Password is: " + U.getPassword();
        return EM.sendEmail(email, "Password Recovery", msg);
    }

    /* GET NAME */
    public String getFullname(String token) {
        String email = JWT.validateToken(token);
        if (email.equals("401"))
            return "401::Token Expired";

        Users U = UR.findById(email).orElse(null);
        return (U != null) ? U.getFullname() : "404::User not found";
    }

    /* GET PROFILE */
    public Users getUserProfile(String token) {
        String email = JWT.validateToken(token);
        if (email.equals("401"))
            return null;

        return UR.findById(email).orElse(null);
    }

    /* GET EMAIL */
    public String getEmail(String token) {
        String email = JWT.validateToken(token);
        if (email.equals("401"))
            return "401::Token Expired";

        return email;
    }

    /* GET ALL USERS */
    public List<Users> getAllUsers() {
        return UR.findAll();
    }

    /* CHANGE PASSWORD */
    public String changePassword(String token, String current, String newpass) {

        String email = JWT.validateToken(token);
        if (email.equals("401"))
            return "401::Invalid Token";

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        if (!u.getPassword().equals(current))
            return "401::Current password is incorrect";

        u.setPassword(newpass);
        UR.save(u);
        return "200::Password updated successfully";
    }

    /* ============================
          NEW ADMIN FEATURES
       ============================ */

    /* ADMIN: BLOCK / UNBLOCK USER */
    public String toggleBlockUser(String email) {

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        u.setBlocked(!u.getBlocked());
        UR.save(u);

        return u.getBlocked()
                ? "200::User blocked"
                : "200::User unblocked";
    }

    /* ADMIN: UPDATE NAME, ROLE, DEPARTMENT */
    public String updateUserByAdmin(String email, int role, String department, String fullname, String availabilityStatus) {

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        u.setFullname(fullname);
        u.setRole(role);
        u.setDepartment(department);

        // Update availability when provided
        if (availabilityStatus != null && !availabilityStatus.trim().isEmpty()) {
            String status = availabilityStatus.trim().toUpperCase();
            if (!status.equals("ACTIVE") && !status.equals("ON_LEAVE")) {
                return "400::Invalid availability status";
            }
            u.setAvailabilityStatus(status);
        }

        UR.save(u);
        return "200::User updated successfully";
    }

    /* ADMIN: RESET PASSWORD */
    public String resetPassword(String email) {

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        String newpass = "user123";
        u.setPassword(newpass);
        UR.save(u);

        return EM.sendEmail(email, "Password Reset",
                "Your new temporary password is: " + newpass);
    }

    /* OFFICER: UPDATE OWN AVAILABILITY (ACTIVE / ON_LEAVE) */
    public String updateAvailabilityForSelf(String token, String status) {

        String email = JWT.validateToken(token);
        if (email.equals("401"))
            return "401::Invalid Token";

        if (status == null)
            return "400::Status required";

        status = status.toUpperCase().trim();
        if (!status.equals("ACTIVE") && !status.equals("ON_LEAVE")) {
            return "400::Invalid status value";
        }

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        u.setAvailabilityStatus(status);
        UR.save(u);

        return "200::Availability updated to " + status;
    }

    /* ADMIN: UPDATE USER AVAILABILITY */
    public String updateAvailabilityByAdmin(String email, String status) {

        if (email == null || email.trim().isEmpty())
            return "400::Email required";

        if (status == null)
            return "400::Status required";

        status = status.toUpperCase().trim();
        if (!status.equals("ACTIVE") && !status.equals("ON_LEAVE")) {
            return "400::Invalid status value";
        }

        Users u = UR.findById(email).orElse(null);
        if (u == null)
            return "404::User not found";

        u.setAvailabilityStatus(status);
        UR.save(u);

        return "200::Availability updated to " + status;
    }
}
