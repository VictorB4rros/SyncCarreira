package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.AnswerDTO;
import com.synccarreira.synccarreira_api.entities.Answer;
import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.AnswerRepository;
import com.synccarreira.synccarreira_api.repositories.QuestionRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AnswerService {

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public List<AnswerDTO> findByStudentAndTrail(Long studentId, Long trailId) {
        List<Answer> result = answerRepository.findByStudentAndTrail(studentId, trailId);
        return result.stream().map(AnswerDTO::new).toList();
    }

    @Transactional
    public AnswerDTO insert(AnswerDTO dto) {
        Answer entity = new Answer();
        copyDtoToEntity(dto, entity);
        entity = answerRepository.save(entity);
        return new AnswerDTO(entity);
    }

    private void copyDtoToEntity(AnswerDTO dto, Answer entity) {
        entity.setContent(dto.getContent());
        Question question = questionRepository.findById(dto.getQuestion().id()).orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        Student student = studentRepository.findById(dto.getStudent().getId()).orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        entity.setQuestion(question);
        entity.setStudent(student);
    }
}
