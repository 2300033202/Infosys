package rb.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import rb.model.Department;
import rb.model.DepartmentManager;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    @Autowired
    DepartmentManager DM;

    @GetMapping("/all")
    public List<Department> getAll() {
        return DM.getAllDepartments();
    }

    // Admin can add new department (optional: you can protect this later)
    @PostMapping("/add")
    public String add(@RequestBody Map<String, String> data) {
        String name = data.get("name");
        return DM.addDepartment(name);
    }
}
