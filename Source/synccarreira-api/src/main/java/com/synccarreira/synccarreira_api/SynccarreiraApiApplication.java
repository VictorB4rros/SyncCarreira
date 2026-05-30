package com.synccarreira.synccarreira_api;

import com.synccarreira.synccarreira_api.entities.*;
import com.synccarreira.synccarreira_api.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SpringBootApplication
public class SynccarreiraApiApplication implements CommandLineRunner {

	@Autowired
	private StudentRepository studentRepository;

	@Autowired
	private RoleRepository roleRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private PsychologistRepository psychologistRepository;

	@Autowired
	private QuestionOptionRepository questionOptionRepository;

	@Autowired
	private AnswerRepository answerRepository;

	public static void main(String[] args) {
		SpringApplication.run(SynccarreiraApiApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {

		Role role1 = roleRepository.findById(1L).orElseThrow();
		Role role2 = roleRepository.findById(2L).orElseThrow();

		Student student1 = new Student();
		student1.setName("José Souza");
		student1.setEmail("jose@gmail.com");
		student1.setPassword("$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6");
		student1.setSchoolType("Escola pública");
		student1.setSchollarYear("3º ano do EM");
		student1.addRole(role1);
		studentRepository.save(student1);

		Psychologist psychologist1 = new Psychologist();
		psychologist1.setName("Juliana oliveira");
		psychologist1.setEmail("juliana@gmail.com");
		psychologist1.setContractExpirationDate(LocalDate.of(2028, 1, 25));
		psychologist1.setCrp("78/94821");
		psychologist1.setPassword(passwordEncoder.encode("12345678"));
		psychologist1.addRole(role2);
		psychologistRepository.save(psychologist1);

		Map<Long, String> simulatedAnswers = new HashMap<>();

		simulatedAnswers.put(4L, "Organização, números e lógica.");
		simulatedAnswers.put(7L, "Resolver problemas lógicos ou matemáticos.");
		simulatedAnswers.put(13L, "Ambientes tranquilos, onde posso ter foco individual e autonomia.");
		simulatedAnswers.put(14L, "Criar coisas novas (desenhos, códigos, textos, receitas).");
		simulatedAnswers.put(19L, "Falar em público ou liderar reuniões.");
		simulatedAnswers.put(23L, "Aprender um novo idioma ou habilidade técnica.");
		simulatedAnswers.put(28L, "A superação de um desafio técnico difícil.");
		simulatedAnswers.put(31L, "Sentir que minhas habilidades não estão sendo aproveitadas.");
		simulatedAnswers.put(33L, "(5) Estou totalmente aberto a desafios fora da minha zona de conforto.");
		simulatedAnswers.put(34L, "\"O realizador\": Gosto de ver resultados concretos e mãos na massa.");

		simulatedAnswers.put(40L, "Concordo");
		simulatedAnswers.put(45L, "Concordo");
		simulatedAnswers.put(47L, "A maioria já decidiu");
		simulatedAnswers.put(52L, "Tecnologia");
		simulatedAnswers.put(59L, "Discordo");
		simulatedAnswers.put(66L, "Nunca aconteceu");
		simulatedAnswers.put(70L, "Preciso ajudar minha família financeiramente");
		simulatedAnswers.put(77L, "Situação financeira");
		simulatedAnswers.put(83L, "É um pouco minha escolha.");
		simulatedAnswers.put(85L, "Fico bem com ela, quero que continue assim");

		simulatedAnswers.put(92L, "Concordo");
		simulatedAnswers.put(97L, "Concordo");
		simulatedAnswers.put(103L, "Concordo totalmente");
		simulatedAnswers.put(108L, "Concordo totalmente");
		simulatedAnswers.put(113L, "Concordo totalmente");
		simulatedAnswers.put(118L, "Concordo totalmente");
		simulatedAnswers.put(123L, "Concordo totalmente");
		simulatedAnswers.put(126L, "Neutro");
		simulatedAnswers.put(132L, "Concordo");
		simulatedAnswers.put(137L, "Concordo");

		List<Answer> allTheAnswers = new ArrayList<>();

		for (Map.Entry<Long, String> entry : simulatedAnswers.entrySet()) {
			Long questionOptionId = entry.getKey();
			String answerContent = entry.getValue();

			QuestionOption questionOption = questionOptionRepository.findById(questionOptionId)
					.orElseThrow(() -> new RuntimeException("ID da opção " + questionOptionId + " não encontrado no banco!"));

			Answer answer = new Answer();
			answer.setStudent(student1);
			answer.setContent(answerContent);
			answer.setQuestionOption(questionOption);

			allTheAnswers.add(answer);
		}

		answerRepository.saveAll(allTheAnswers);
		System.out.println(">>> SEED DE RESPOSTAS DO ALUNO CONCLUÍDO COM SUCESSO! <<<");

	}
}
