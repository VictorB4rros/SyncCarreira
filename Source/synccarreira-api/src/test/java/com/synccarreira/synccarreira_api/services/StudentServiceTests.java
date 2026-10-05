package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.StudentDTO;
import com.synccarreira.synccarreira_api.dto.StudentDetailsDTO;
import com.synccarreira.synccarreira_api.dto.StudentInsertDTO;
import com.synccarreira.synccarreira_api.dto.StudentScoreDTO;
import com.synccarreira.synccarreira_api.entities.Role;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.RoleRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.services.exceptions.DatabaseException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.StudentFactory;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTests {

    @InjectMocks
    private StudentService service;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordRecoverService passwordRecoverService;

    private Long existingStudentId, nonExistingStudentId, dependentStudentId, studentRoleId, existingSchoolClassId;
    private Student student;
    private Role studentRole;
    private StudentInsertDTO studentInsertDTO, studentUpdateDTO;
    private StudentDetailsDTO studentDetailsDTO;
    private Pageable pageable;
    private Page<StudentDetailsDTO> studentDetailsPage;

    @BeforeEach
    void setUp() {
        existingStudentId = 1L;
        nonExistingStudentId = 100L;
        dependentStudentId = 2L;
        studentRoleId = 1L;
        existingSchoolClassId = 1L;

        student = StudentFactory.createStudent();
        studentRole = StudentFactory.createStudentRole();
        studentInsertDTO = StudentFactory.createStudentInsertDTO();
        studentUpdateDTO = StudentFactory.createStudentUpdateDTO();
        studentDetailsDTO = StudentFactory.createStudentDetailsDTO();

        pageable = PageRequest.of(0, 10);
        studentDetailsPage = new PageImpl<>(List.of(studentDetailsDTO), pageable, 1);
    }

    @Test
    void findAllShouldReturnStudentDetailsDTOPage() {
        Mockito.when(studentRepository.searchAllPaged(pageable)).thenReturn(studentDetailsPage);

        Page<StudentDetailsDTO> result = service.findAll(pageable);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.getTotalElements());
        Assertions.assertEquals(studentDetailsDTO.getId(), result.getContent().getFirst().getId());
        Assertions.assertEquals(studentDetailsDTO.getName(), result.getContent().getFirst().getName());
        Assertions.assertEquals(studentDetailsDTO.getClassName(), result.getContent().getFirst().getClassName());
        Assertions.assertEquals(studentDetailsDTO.getInstitutionName(), result.getContent().getFirst().getInstitutionName());
    }

    @Test
    void findByIdShouldReturnStudentDTOWhenIdExists() {
        Mockito.when(studentRepository.findById(existingStudentId)).thenReturn(Optional.of(student));

        StudentDTO result = service.findById(existingStudentId);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(existingStudentId, result.getId());
        Assertions.assertEquals(student.getName(), result.getName());
        Assertions.assertEquals(student.getEmail(), result.getEmail());
        Assertions.assertEquals(student.getScholarYear(), result.getSchollarYear());
        Assertions.assertEquals(student.getSchoolType(), result.getSchoolType());
        Assertions.assertEquals(student.getRace(), result.getRace());
        Assertions.assertEquals(1, result.getRoles().size());
    }

    @Test
    void findByIdShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(studentRepository.findById(nonExistingStudentId)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.findById(nonExistingStudentId);
        });
    }

    @Test
    void insertShouldReturnStudentDTOAndSendFirstAccessEmailWhenDataIsValid() {
        ArgumentCaptor<Student> captor = ArgumentCaptor.forClass(Student.class);
        Mockito.when(roleRepository.findById(studentRoleId)).thenReturn(Optional.of(studentRole));
        Mockito.when(studentRepository.save(any())).thenReturn(student);

        StudentDTO result = service.insert(studentInsertDTO);

        Mockito.verify(studentRepository).save(captor.capture());
        Mockito.verify(passwordRecoverService).sendFirstAccessEmail(studentInsertDTO.getName(), studentInsertDTO.getEmail());
        Student savedStudent = captor.getValue();

        Assertions.assertEquals(studentInsertDTO.getName(), savedStudent.getName());
        Assertions.assertEquals(studentInsertDTO.getEmail(), savedStudent.getEmail());
        Assertions.assertEquals(studentInsertDTO.getSchollarYear(), savedStudent.getScholarYear());
        Assertions.assertEquals(studentInsertDTO.getSchoolType(), savedStudent.getSchoolType());
        Assertions.assertEquals(studentInsertDTO.getRace(), savedStudent.getRace());
        Assertions.assertEquals(1, savedStudent.getRoles().size());
        Assertions.assertNotNull(result);
        Assertions.assertEquals(student.getId(), result.getId());
        Assertions.assertEquals(student.getName(), result.getName());
        Assertions.assertEquals(student.getEmail(), result.getEmail());
    }

    @Test
    void updateShouldReturnStudentDTOWhenIdExists() {
        Mockito.when(studentRepository.getReferenceById(existingStudentId)).thenReturn(student);
        Mockito.when(roleRepository.findById(studentRoleId)).thenReturn(Optional.of(studentRole));
        Mockito.when(studentRepository.save(any())).thenReturn(student);

        StudentDTO result = service.update(existingStudentId, studentUpdateDTO);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(existingStudentId, result.getId());
        Assertions.assertEquals(studentUpdateDTO.getName(), result.getName());
        Assertions.assertEquals(studentUpdateDTO.getEmail(), result.getEmail());
        Assertions.assertEquals(studentUpdateDTO.getSchollarYear(), result.getSchollarYear());
        Assertions.assertEquals(studentUpdateDTO.getSchoolType(), result.getSchoolType());
        Assertions.assertEquals(studentUpdateDTO.getRace(), result.getRace());
        Assertions.assertEquals(1, result.getRoles().size());
        Mockito.verify(passwordRecoverService, Mockito.never()).sendFirstAccessEmail(anyString(), anyString());
    }

    @Test
    void updateShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(studentRepository.getReferenceById(nonExistingStudentId)).thenThrow(EntityNotFoundException.class);

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.update(nonExistingStudentId, studentUpdateDTO);
        });

        Mockito.verify(studentRepository, Mockito.never()).save(any());
    }

    @Test
    void deleteShouldDoNothingWhenIdExists() {
        Mockito.when(studentRepository.existsById(existingStudentId)).thenReturn(true);

        Assertions.assertDoesNotThrow(() -> {
            service.delete(existingStudentId);
        });

        Mockito.verify(studentRepository).deleteById(existingStudentId);
    }

    @Test
    void deleteShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(studentRepository.existsById(nonExistingStudentId)).thenReturn(false);

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.delete(nonExistingStudentId);
        });

        Mockito.verify(studentRepository, Mockito.never()).deleteById(any());
    }

    @Test
    void deleteShouldReturnDatabaseExceptionWhenStudentHasDependentData() {
        Mockito.when(studentRepository.existsById(dependentStudentId)).thenReturn(true);
        Mockito.doThrow(DataIntegrityViolationException.class).when(studentRepository).deleteById(dependentStudentId);

        Assertions.assertThrows(DatabaseException.class, () -> {
            service.delete(dependentStudentId);
        });
    }

    @Test
    void setSchoolClassShouldAssignSchoolClassToStudent() {
        Assertions.assertDoesNotThrow(() -> {
            service.setSchoolClass(existingStudentId, existingSchoolClassId);
        });

        Mockito.verify(studentRepository).setSchoolClass(existingStudentId, existingSchoolClassId);
    }

    @Test
    void getScoreShouldReturnStudentScoreDTOWhenIdExists() {
        Mockito.when(studentRepository.findById(existingStudentId)).thenReturn(Optional.of(student));

        StudentScoreDTO result = service.getScore(existingStudentId);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(existingStudentId, result.studentId());
        Assertions.assertEquals(student.getHumanitiesScore(), result.humanitiesScore());
        Assertions.assertEquals(student.getExactSciencesScore(), result.exactSciencesScore());
        Assertions.assertEquals(student.getBiologicalSciencesScore(), result.biologicalSciencesScore());
        Assertions.assertEquals(student.getArtsScore(), result.artsScore());
    }

    @Test
    void getScoreShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(studentRepository.findById(nonExistingStudentId)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.getScore(nonExistingStudentId);
        });
    }
}
