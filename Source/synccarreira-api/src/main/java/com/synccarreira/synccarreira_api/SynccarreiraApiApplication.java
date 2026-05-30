package com.synccarreira.synccarreira_api;

import com.synccarreira.synccarreira_api.entities.Role;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.RoleRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SynccarreiraApiApplication implements CommandLineRunner {

	@Autowired
	private StudentRepository studentRepository;

	@Autowired
	private RoleRepository roleRepository;

	public static void main(String[] args) {
		SpringApplication.run(SynccarreiraApiApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {

		Role role = roleRepository.findById(1L).orElseThrow();

		Student student1 = new Student();
		student1.setName("José Souza");
		student1.setEmail("jose@gmail.com");
		student1.setPassword("$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6");
		student1.setSchoolType("Escola pública");
		student1.setSchollarYear("3º ano do EM");
		student1.addRole(role);
		studentRepository.save(student1);


	}
}
