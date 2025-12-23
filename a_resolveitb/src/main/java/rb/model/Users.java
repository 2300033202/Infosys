package rb.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class Users {

    @Column(name = "fullname")
    private String fullname;

    @Id
    @Column(name = "email")
    private String email;

    @Column(name = "role")
    private int role;

    @Column(name = "password")
    private String password;

    @Column(name = "department")
    private String department;

    @Column(name = "joined_date", insertable = false, updatable = false)
    private String joinedDate;

    @Column(name = "phone")
    private String phone;

    @Column(name = "address")
    private String address;

    @Column(name = "photo", columnDefinition = "LONGTEXT")
    private String photo;

    @Column(name = "blocked")
    private Boolean blocked = false;   // Wrapper type avoids NULL issues

    // 🔥 NEW FIELD
    @Column(name = "availability_status")
    private String availabilityStatus = "ACTIVE";   // ACTIVE / ON_LEAVE


    // ================== GETTERS / SETTERS ======================
    public Boolean getBlocked() { return blocked; }
    public void setBlocked(Boolean blocked) { this.blocked = blocked; }

    public String getFullname() { return fullname; }
    public void setFullname(String fullname) { this.fullname = fullname; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public int getRole() { return role; }
    public void setRole(int role) { this.role = role; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJoinedDate() { return joinedDate; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    // 🔥 NEW GETTER/SETTER
    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    @Override
    public String toString() {
        return "Users{" +
                "fullname='" + fullname + '\'' +
                ", email='" + email + '\'' +
                ", role=" + role +
                ", department='" + department + '\'' +
                ", joinedDate='" + joinedDate + '\'' +
                ", phone='" + phone + '\'' +
                ", address='" + address + '\'' +
                ", blocked=" + blocked +
                ", availabilityStatus='" + availabilityStatus + '\'' +
                ", photo=" + (photo != null ? "[BASE64]" : "null") +
                '}';
    }
}
