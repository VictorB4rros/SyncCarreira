package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.*;
import com.synccarreira.synccarreira_api.entities.enums.InstitutionType;
import com.synccarreira.synccarreira_api.entities.enums.QuestionType;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;
import com.synccarreira.synccarreira_api.projections.AnsweredQuestionsProjection;
import com.synccarreira.synccarreira_api.projections.PanelStudentProjection;
import com.synccarreira.synccarreira_api.projections.TrailQuestionCountProjection;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;

@DataJpaTest
@ActiveProfiles("test")
public class PsychologistPanelQueriesTests {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    private Institution institution;
    private Trail trail;
    private Question checkboxQuestion, likertQuestion;
    private Student ana, bruno, otherInstitutionStudent;

    @BeforeEach
    void setUp() {
        institution = persistInstitution("Escola Estadual Pedro II", "33158816000105");
        Institution otherInstitution = persistInstitution("Colégio Particular", "11222333000181");
        SchoolClass classA = persistSchoolClass("3º ano A", institution);
        SchoolClass classB = persistSchoolClass("3º ano B", institution);
        SchoolClass otherClass = persistSchoolClass("2º ano", otherInstitution);

        ana = persistStudent("Ana", "ana@gmail.com", classB);
        bruno = persistStudent("Bruno", "bruno@gmail.com", classA);
        otherInstitutionStudent = persistStudent("Carlos", "carlos@gmail.com", otherClass);

        trail = new Trail();
        trail.setName(TrailName.AUTOCONHECIMENTO);
        trail.setSequentialOrder(99);
        entityManager.persist(trail);

        checkboxQuestion = persistQuestion("Quais assuntos te interessam?", QuestionType.CHECKBOX);
        likertQuestion = persistQuestion("Tenho clareza sobre meu futuro.", QuestionType.LIKERT);
        QuestionOption technology = persistOption("Tecnologia", checkboxQuestion);
        QuestionOption arts = persistOption("Artes", checkboxQuestion);
        QuestionOption agree = persistOption("Concordo", likertQuestion);

        // Ana marcou duas opções da pergunta CHECKBOX: ainda conta como uma pergunta respondida
        persistAnswer(ana, technology);
        persistAnswer(ana, arts);
        persistAnswer(ana, agree);
        persistAnswer(bruno, technology);
        persistAnswer(otherInstitutionStudent, agree);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void searchPanelStudentsByInstitutionShouldReturnOnlyStudentsOfInstitutionOrderedByClassAndName() {
        List<PanelStudentProjection> result = studentRepository.searchPanelStudentsByInstitution(institution.getId());

        Assertions.assertEquals(2, result.size());
        Assertions.assertEquals("Bruno", result.get(0).studentName());
        Assertions.assertEquals("3º ano A", result.get(0).schoolClassName());
        Assertions.assertEquals("Ana", result.get(1).studentName());
        Assertions.assertEquals("3º ano B", result.get(1).schoolClassName());
    }

    @Test
    void countAnsweredQuestionsByInstitutionShouldCountDistinctQuestionsPerStudentAndTrail() {
        List<AnsweredQuestionsProjection> result = answerRepository.countAnsweredQuestionsByInstitution(institution.getId());

        Assertions.assertEquals(2, result.size());
        Assertions.assertEquals(2L, answeredQuestionsOf(result, ana.getId()));
        Assertions.assertEquals(1L, answeredQuestionsOf(result, bruno.getId()));
        Assertions.assertTrue(result.stream().noneMatch(row -> row.studentId().equals(otherInstitutionStudent.getId())));
        Assertions.assertTrue(result.stream().allMatch(row -> row.trailId().equals(trail.getId())));
    }

    @Test
    void countQuestionsByTrailShouldReturnNumberOfQuestionsOfEachTrail() {
        List<TrailQuestionCountProjection> result = questionRepository.countQuestionsByTrail();

        TrailQuestionCountProjection trailCount = result.stream()
                .filter(row -> row.trailId().equals(trail.getId()))
                .findFirst()
                .orElseThrow();
        Assertions.assertEquals(2L, trailCount.totalQuestions());
    }

    private static Long answeredQuestionsOf(List<AnsweredQuestionsProjection> result, Long studentId) {
        return result.stream()
                .filter(row -> row.studentId().equals(studentId))
                .findFirst()
                .orElseThrow()
                .answeredQuestions();
    }

    private Institution persistInstitution(String legalName, String cnpj) {
        return entityManager.persist(new Institution(null, legalName, legalName, cnpj, InstitutionType.PUBLICA, Boolean.TRUE, Instant.now()));
    }

    private SchoolClass persistSchoolClass(String name, Institution institution) {
        SchoolClass schoolClass = new SchoolClass(null, name, 2026, Instant.now());
        schoolClass.setInstitution(institution);
        return entityManager.persist(schoolClass);
    }

    private Student persistStudent(String name, String email, SchoolClass schoolClass) {
        Student student = new Student();
        student.setName(name);
        student.setEmail(email);
        student.setDeterminedSchoolClass(schoolClass);
        return entityManager.persist(student);
    }

    private Question persistQuestion(String content, QuestionType type) {
        Question question = new Question();
        question.setContent(content);
        question.setQuestionType(type);
        question.setTrail(trail);
        return entityManager.persist(question);
    }

    private QuestionOption persistOption(String text, Question question) {
        QuestionOption option = new QuestionOption();
        option.setOptionText(text);
        option.setHumanitiesWeight(0.0);
        option.setBiologicalSciencesWeight(0.0);
        option.setExactSciencesWeight(0.0);
        option.setArtsWeight(0.0);
        option.setQuestion(question);
        return entityManager.persist(option);
    }

    private void persistAnswer(Student student, QuestionOption option) {
        Answer answer = new Answer();
        answer.setContent(option.getOptionText());
        answer.setStudent(student);
        answer.setQuestionOption(option);
        entityManager.persist(answer);
    }
}
