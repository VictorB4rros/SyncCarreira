package com.synccarreira.synccarreira_api;

import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SynccarreiraApiApplication implements CommandLineRunner {

	@Autowired
	private StudentRepository studentRepository;

	public static void main(String[] args) {
		SpringApplication.run(SynccarreiraApiApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {

		Student student = new Student();
		student.setName("José Souza");
		student.setEmail("jose@gmail.com");
		student.setPassword("$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6");
		student.setSchoolType("Escola pública");
		student.setSchollarYear("3º ano do EM");

		studentRepository.save(student);
	}
}
