package rb.model;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import rb.rep.DepartmentRepository;

import java.util.List;

@Service
public class DepartmentManager {

    @Autowired
    DepartmentRepository DR;

    public List<Department> getAllDepartments() {
        return DR.findAll();
    }

    public String addDepartment(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "401::Department name required";
        }
        name = name.trim();
        if (DR.existsByName(name)) {
            return "401::Department already exists";
        }
        Department d = new Department(name);
        DR.save(d);
        return "200::Department added";
    }
}
