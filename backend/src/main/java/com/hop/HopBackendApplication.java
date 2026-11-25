package com.hop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HopBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HopBackendApplication.class, args);
	}

}
