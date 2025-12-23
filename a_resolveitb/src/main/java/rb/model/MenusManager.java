package rb.model;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.gson.GsonBuilder;

import rb.rep.MenusRepository;
import rb.rep.UsersRepository;

@Service
public class MenusManager {

    @Autowired
    MenusRepository MR;

    @Autowired
    JWTManager JWT;

    @Autowired
    UsersRepository UR;

    public String getMenus() {
        return new GsonBuilder().create().toJson(MR.findAll());
    }

    public String getMenusByRole(String token) {

        // NULL or EMPTY TOKEN FIX
        if (token == null || token.trim().isEmpty()) {
            return "401:: Token missing";
        }

        // Validate
        String email = JWT.validateToken(token);
        if (email.equals("401")) {
            return "401:: Invalid Token";
        }

        // Get user
        Users U = UR.findById(email).orElse(null);
        if (U == null) {
            return "404:: User not found";
        }

        // Fetch menu items
        List<Menus> menuitems = MR.findbyRole(U.getRole());

        return new GsonBuilder().create().toJson(menuitems);
    }
}
