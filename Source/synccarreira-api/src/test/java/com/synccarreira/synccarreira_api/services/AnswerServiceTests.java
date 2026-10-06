package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.AnswerDTO;
import com.synccarreira.synccarreira_api.dto.AnswerInsertDTO;
import com.synccarreira.synccarreira_api.entities.Answer;
import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.entities.QuestionOption;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.AnswerRepository;
import com.synccarreira.synccarreira_api.repositories.QuestionOptionRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.QuestionFactory;
import com.synccarreira.synccarreira_api.tests.StudentFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;

@ExtendWith(MockitoExtension.class)
public class AnswerServiceTests {

    @InjectMocks
    private AnswerService service;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private StudentRepository studentRepository;

    private Student student;
    private Question question;
    private QuestionOption option;
    private AnswerInsertDTO dto;
    private Long nonExistingId;

    @BeforeEach
    void setUp() {
        student = StudentFactory.createStudent();
        question = QuestionFactory.createQuestion();
        option = question.getOptions().getFirst();
        dto = new AnswerInsertDTO(option.getOptionText(), student.getId(), option.getId());
        nonExistingId = 100L;
    }

    private void mockValidInsert() {
        Mockito.when(questionOptionRepository.findById(option.getId())).thenReturn(Optional.of(option));
        Mockito.when(studentRepository.findById(student.getId())).thenReturn(Optional.of(student));
        Mockito.when(answerRepository.save(any())).thenAnswer(invocation -> {
            Answer saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });
    }

    @Test
    void insertShouldDeletePreviousAnswersOfSameQuestionBeforeSavingNewAnswer() {
        mockValidInsert();
        Mockito.when(answerRepository.findByStudentId(student.getId())).thenReturn(List.of());

        AnswerDTO result = service.insert(dto);

        Assertions.assertEquals(10L, result.getId());
        InOrder inOrder = Mockito.inOrder(answerRepository);
        inOrder.verify(answerRepository).deleteByStudentAndQuestion(student.getId(), question.getId());
        inOrder.verify(answerRepository).save(any());
    }

    @Test
    void insertShouldRecalculateScoreUsingOnlyCurrentAnswers() {
        mockValidInsert();
        // Depois da substituição, só a nova resposta (peso 1.0 em exatas) existe para o aluno
        Answer currentAnswer = new Answer(10L, option.getOptionText(), student, option);
        Mockito.when(answerRepository.findByStudentId(student.getId())).thenReturn(List.of(currentAnswer));

        service.insert(dto);

        Assertions.assertEquals(1.0, student.getExactSciencesScore());
        Assertions.assertEquals(0.0, student.getHumanitiesScore());
        Assertions.assertEquals(0.0, student.getBiologicalSciencesScore());
        Assertions.assertEquals(0.0, student.getArtsScore());
        Mockito.verify(studentRepository).save(student);
    }

    @Test
    void insertShouldThrowResourceNotFoundExceptionWhenQuestionOptionDoesNotExist() {
        Mockito.when(questionOptionRepository.findById(nonExistingId)).thenReturn(Optional.empty());
        AnswerInsertDTO invalidDto = new AnswerInsertDTO("Matemática", student.getId(), nonExistingId);

        Assertions.assertThrows(ResourceNotFoundException.class, () -> service.insert(invalidDto));
        Mockito.verify(answerRepository, Mockito.never()).deleteByStudentAndQuestion(anyLong(), anyLong());
        Mockito.verify(answerRepository, Mockito.never()).save(any());
    }
}
