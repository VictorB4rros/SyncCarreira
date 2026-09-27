package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.*;
import com.synccarreira.synccarreira_api.entities.PasswordRecover;
import com.synccarreira.synccarreira_api.entities.Role;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.PasswordRecoverRepository;
import com.synccarreira.synccarreira_api.repositories.RoleRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.services.events.EmailEvent;
import com.synccarreira.synccarreira_api.services.exceptions.DatabaseException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class StudentService {

    @Value("${email.password-recover.token.minutes}")
    private Long tokenMinutes;

    @Value("${email.password-recover.uri}")
    private String recoverUri;

    private final StudentRepository studentRepository;

    private final RoleRepository roleRepository;

    private final PasswordRecoverRepository passwordRecoverRepository;

    private final ApplicationEventPublisher eventPublisher;

    public StudentService(
            final StudentRepository studentRepository,
            final RoleRepository roleRepository,
            final PasswordRecoverRepository passwordRecoverRepository,
            final ApplicationEventPublisher eventPublisher) {
        this.studentRepository = studentRepository;
        this.roleRepository = roleRepository;
        this.passwordRecoverRepository = passwordRecoverRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public Page<StudentDetailsDTO> findAll(Pageable pageable) {
        return studentRepository.searchAllPaged(pageable);
    }

    @Transactional(readOnly = true)
    public StudentDTO findById(Long id) {
        Student entity = studentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Recurso não encontrado"));
        return new StudentDTO(entity);
    }

    @Transactional
    public StudentDTO insert(StudentInsertDTO dto) {
        Student entity = new Student();
        copyDtoToEntity(dto, entity);
        entity = studentRepository.save(entity);

        String token = UUID.randomUUID().toString();

        String subject = "SyncCarreira - Primeiro Acesso";
        Map<String, Object> map = new HashMap<>();
        map.put("recipientName", dto.getName());
        map.put("email", dto.getEmail());
        map.put("link", recoverUri + token);

        PasswordRecover passwordRecover = new PasswordRecover();
        passwordRecover.setEmail(dto.getEmail());
        passwordRecover.setToken(token);
        passwordRecover.setExpiration(Instant.now().plusSeconds(tokenMinutes * 60L));
        passwordRecover = passwordRecoverRepository.save(passwordRecover);

        eventPublisher.publishEvent(new EmailEvent(dto.getEmail(), subject, map));

        return new StudentDTO(entity);
    }

    @Transactional
    public StudentDTO update(Long id, @Valid StudentUpdateDTO dto) {
        try {
            Student entity = studentRepository.getReferenceById(id);
            copyDtoToEntity(dto, entity);
            entity = studentRepository.save(entity);
            return new StudentDTO(entity);
        }
        catch (EntityNotFoundException e) {
            throw new ResourceNotFoundException("Resource not found");
        }
    }

    @Transactional(propagation = Propagation.SUPPORTS)
    public void delete(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found");
        }
        try {
            studentRepository.deleteById(id);
        }
        catch (DataIntegrityViolationException e) {
            throw new DatabaseException("Referential integrity failure");
        }
    }

    @Transactional
    public void setSchoolClass(Long studentId, Long classId) {
        studentRepository.setSchoolClass(studentId, classId);
    }

    @Transactional(readOnly = true)
    public StudentScoreDTO getScore(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found. ID: " + id));
        return new StudentScoreDTO(student);
    }

    private void copyDtoToEntity(StudentInsertDTO dto, Student entity) {
        entity.setName(dto.getName());
        entity.setEmail(dto.getEmail());
        entity.setSchoolType(dto.getSchoolType());
        entity.setScholarYear(dto.getSchollarYear());
        entity.setRace(dto.getRace());
        entity.getRoles().clear();
        Optional<Role> role = roleRepository.findById(1L);
        role.ifPresent(entity::addRole);
    }

    private void copyDtoToEntity(StudentUpdateDTO dto, Student entity) {
        entity.setName(dto.getName());
        entity.setEmail(dto.getEmail());
        entity.setSchoolType(dto.getSchoolType());
        entity.setScholarYear(dto.getSchollarYear());
        entity.setRace(dto.getRace());
        entity.getRoles().clear();
        Optional<Role> role = roleRepository.findById(1L);
        role.ifPresent(entity::addRole);
    }
}
