package rb.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import rb.model.MenusManager;

@RestController
@RequestMapping("/menus")
@CrossOrigin(origins = "*")
public class MenusController {

    @Autowired
    MenusManager MM;

    @PostMapping("/getmenus")
    public String getmenus() {
        return MM.getMenus();
    }

    @PostMapping("/getmenusbyrole")
    public String getMenusByRole(@RequestBody Map<String, String> data) {

        String token = data.get("csrid");

        // NULL or EMPTY TOKEN FIX
        if (token == null || token.trim().isEmpty()) {
            return "401:: Token missing";
        }

        return MM.getMenusByRole(token);
    }
}
