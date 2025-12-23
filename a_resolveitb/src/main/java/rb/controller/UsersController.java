package rb.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import rb.model.EmailManager;
import rb.model.Users;
import rb.model.UsersManager;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UsersController {

    @Autowired
    UsersManager UM;

    @Autowired
    EmailManager EM;

    /* SIGNUP */
    @PostMapping("/signup")
    public String signup(@RequestBody Users user) {
        if (user.getEmail() != null)
            user.setEmail(user.getEmail().trim().toLowerCase());
        return UM.addUsers(user);
    }

    /* LOGIN */
    @PostMapping("/signin")
    public String signin(@RequestBody Users U) {
        return UM.validateCredentials(U.getEmail().trim().toLowerCase(), U.getPassword());
    }

    /* NAME */
    @PostMapping("/getfullname")
    public String getFullname(@RequestBody Map<String,String> data) {
        return UM.getFullname(data.get("csrid"));
    }

    /* GET PROFILE */
    @PostMapping("/profile")
    public Users getProfile(@RequestBody Map<String,String> data) {
        return UM.getUserProfile(data.get("csrid"));
    }

    /* GET EMAIL FROM TOKEN */
    @PostMapping("/getemail")
    public String getEmail(@RequestBody Map<String,String> data) {
        return UM.getEmail(data.get("csrid"));
    }

    /* ALL USERS */
    @GetMapping("/all")
    public List<Users> getAllUsers() {
        return UM.getAllUsers();
    }

    /* UPDATE PROFILE */
    @PostMapping("/updateprofile")
    public String updateProfile(@RequestBody Map<String,String> data) {
        return UM.updateProfile(
                data.get("csrid"),
                data.get("phone"),
                data.get("address"),
                data.get("photo")
        );
    }

    /* CHANGE PASSWORD */
    @PostMapping("/changepassword")
    public String changePassword(@RequestBody Map<String,String> data) {
        return UM.changePassword(
                data.get("csrid"),
                data.get("current"),
                data.get("new")
        );
    }

    /* ADMIN OPERATIONS */
    @PostMapping("/block")
    public String blockUser(@RequestBody Map<String,String> data) {
        return UM.toggleBlockUser(data.get("email"));
    }

    @PostMapping("/adminupdate")
    public String adminUpdate(@RequestBody Map<String,String> data) {
        return UM.updateUserByAdmin(
                data.get("email"),
                Integer.parseInt(data.get("role")),
                data.get("department"),
                data.get("fullname"),
                data.getOrDefault("availabilityStatus", "")
        );
    }

    @PostMapping("/resetpass")
    public String resetPass(@RequestBody Map<String,String> data) {
        return UM.resetPassword(data.get("email"));
    }

    /* AVAILABILITY - OFFICER SELF UPDATE */
    @PostMapping("/availability/self")
    public String updateAvailabilitySelf(@RequestBody Map<String, String> data) {
        return UM.updateAvailabilityForSelf(
                data.get("csrid"),
                data.get("status")
        );
    }

    /* AVAILABILITY - ADMIN UPDATE ANY USER */
    @PostMapping("/availability/admin")
    public String updateAvailabilityByAdmin(@RequestBody Map<String, String> data) {
        return UM.updateAvailabilityByAdmin(
                data.get("email"),
                data.get("status")
        );
    }


    /* SEND OTP - UPDATED */
    @PostMapping("/requestOtp")
    public String requestOtp(@RequestBody Map<String, String> data) {
        try {
            String email = data.get("email").trim().toLowerCase();
            return EM.generateAndSendOTP(email);
        } catch (Exception e) {
            return "500::" + e.getMessage();
        }
    }

    /* VERIFY OTP - UPDATED */
    @PostMapping("/verifyOtp")
    public String verifyOtp(@RequestBody Map<String, String> data) {
        try {
            String email = data.get("email").trim().toLowerCase();
            String otp = data.get("otp");

            if (EM.verifyOTP(email, otp)) {
                return "200::OTP verified";
            }
            return "401::Invalid or expired OTP";

        } catch (Exception e) {
            return "500::" + e.getMessage();
        }
    }
}
