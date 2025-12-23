package rb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling   // 🔥 REQUIRED for auto escalation
@SpringBootApplication
public class AResolveitbApplication {

	public static void main(String[] args) {
		SpringApplication.run(AResolveitbApplication.class, args);
	}

}
