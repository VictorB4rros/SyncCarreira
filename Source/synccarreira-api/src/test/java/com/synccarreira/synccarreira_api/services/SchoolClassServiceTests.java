package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.SchoolClassDTO;
import com.synccarreira.synccarreira_api.dto.SchoolClassInsertDTO;
import com.synccarreira.synccarreira_api.dto.SchoolClassUpdateDTO;
import com.synccarreira.synccarreira_api.entities.Institution;
import com.synccarreira.synccarreira_api.entities.SchoolClass;
import com.synccarreira.synccarreira_api.repositories.InstitutionRepository;
import com.synccarreira.synccarreira_api.repositories.SchoolClassRepository;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ConflictException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.InstitutionFactory;
import com.synccarreira.synccarreira_api.tests.SchoolClassFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class SchoolClassServiceTests {

    @InjectMocks
    private SchoolClassService service;

    @Mock
    private SchoolClassRepository schoolClassRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    private SchoolClass schoolClass, schoolClass1;
    private Institution institution, inactiveInstitution;
    private Long existingInstitutionId, nonExistingInstitutionId, existingSchoolClassId, nonExistingSchoolClassId;
    private List<SchoolClass> schoolClassList, emptyList;
    private SchoolClassInsertDTO validSchoolClassInsertDTO, invalidSchoolClassInsertDTO;
    private SchoolClassUpdateDTO schoolClassUpdateDTO;

    @BeforeEach
    void setUp() {
        schoolClass = SchoolClassFactory.createSchoolClass();
        schoolClass1 = SchoolClassFactory.createSchoolClass();
        validSchoolClassInsertDTO = SchoolClassFactory.createValidSchoolClassInsertDTO();
        invalidSchoolClassInsertDTO = SchoolClassFactory.createInvalidSchoolClassInsertDTO();
        schoolClassUpdateDTO = SchoolClassFactory.createSchoolClassUpdateDTO();
        institution = InstitutionFactory.createInstitution();
        inactiveInstitution = InstitutionFactory.createInactiveInstitution();
        existingInstitutionId = 1L;
        nonExistingInstitutionId = 100L;
        existingSchoolClassId = 1L;
        nonExistingSchoolClassId = 100L;

        emptyList = new ArrayList<>();
        schoolClassList = new ArrayList<>();
        schoolClassList.add(schoolClass);
        schoolClassList.add(schoolClass1);
    }

    @Test
    void findAllShouldReturnSchoolClassDTOList() {
        Mockito.when(schoolClassRepository.findAll()).thenReturn(schoolClassList);

        List<SchoolClassDTO> result = service.findAll();

        Assertions.assertEquals(2, result.size());
        Assertions.assertEquals(schoolClass.getId(), result.getLast().id());
        Assertions.assertEquals(schoolClass.getName(), result.getLast().name());
        Assertions.assertEquals(schoolClass.getSchoolYear(), result.getLast().schoolYear());
        Assertions.assertEquals(schoolClass1.getId(), result.getLast().id());
        Assertions.assertEquals(schoolClass1.getName(), result.getLast().name());
        Assertions.assertEquals(schoolClass1.getSchoolYear(), result.getLast().schoolYear());
    }

    @Test
    void findByInstitutionIdShouldReturnSchoolClassDTOListWhenIdExists() {
        Mockito.when(schoolClassRepository.findByInstitutionId(existingInstitutionId)).thenReturn(schoolClassList);

        List<SchoolClassDTO> result = service.findByInstitutionId(existingInstitutionId);

        Assertions.assertEquals(2, result.size());
        Assertions.assertEquals(schoolClass.getId(), result.getLast().id());
        Assertions.assertEquals(schoolClass.getName(), result.getLast().name());
        Assertions.assertEquals(schoolClass.getSchoolYear(), result.getLast().schoolYear());
        Assertions.assertEquals(schoolClass1.getId(), result.getLast().id());
        Assertions.assertEquals(schoolClass1.getName(), result.getLast().name());
        Assertions.assertEquals(schoolClass1.getSchoolYear(), result.getLast().schoolYear());
    }

    @Test
    void findByInstitutionIdShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
       Mockito.when(schoolClassRepository.findByInstitutionId(nonExistingInstitutionId)).thenReturn(emptyList);

       Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.findByInstitutionId(nonExistingInstitutionId);
       });
    }

    @Test
    void findByIdShouldReturnSchooClassDTOWhenIdExists() {
        Mockito.when(schoolClassRepository.findById(existingSchoolClassId)).thenReturn(Optional.of(schoolClass));

        SchoolClassDTO result = service.findById(existingSchoolClassId);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(result.id(), existingInstitutionId);
        Assertions.assertEquals(result.name(), schoolClass.getName());
        Assertions.assertEquals(result.schoolYear(), schoolClass.getSchoolYear());
        Assertions.assertEquals(result.createdAt(), schoolClass.getCreatedAt());
    }

    @Test
    void findByIdShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(schoolClassRepository.findById(nonExistingSchoolClassId)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.findById(nonExistingSchoolClassId);
        });
    }

    @Test
    void createShouldReturnSchoolClassDTOWhenInstitutionIdExistsAndInstitutionIsActive() {
        Mockito.when(institutionRepository.findById(validSchoolClassInsertDTO.institutionId())).thenReturn(Optional.of(institution));
        Mockito.when(schoolClassRepository.save(any())).thenReturn(schoolClass);

        SchoolClassDTO result = service.create(validSchoolClassInsertDTO);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(schoolClass.getId(), result.id());
        Assertions.assertEquals(schoolClass.getName(), result.name());
        Assertions.assertEquals(schoolClass.getSchoolYear(), result.schoolYear());
        Assertions.assertEquals(schoolClass.getCreatedAt(), result.createdAt());
    }

    @Test
    void createShouldReturnResourceNotFoundExceptionWhenInstitutionIdDoesNotExist() {
        Mockito.when(institutionRepository.findById(invalidSchoolClassInsertDTO.institutionId())).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.create(invalidSchoolClassInsertDTO);
        });
    }

    @Test
    void createShouldReturnBusinessExceptionWhenInstitutionIsInactive() {
        Mockito.when(institutionRepository.findById(validSchoolClassInsertDTO.institutionId())).thenReturn(Optional.of(inactiveInstitution));

        Assertions.assertThrows(BusinessException.class, () -> {
            service.create(validSchoolClassInsertDTO);
        });
    }

    @Test
    void updateShouldReturnSchoolClassDTOWhenIdExists() {
        Mockito.when(schoolClassRepository.findById(existingSchoolClassId)).thenReturn(Optional.of(schoolClass));
        Mockito.when(schoolClassRepository.save(any())).thenReturn(schoolClass);

        SchoolClassDTO result = service.update(existingSchoolClassId, schoolClassUpdateDTO);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(schoolClass.getId(), result.id());
        Assertions.assertEquals(schoolClass.getSchoolYear(), result.schoolYear());
        Assertions.assertEquals(schoolClass.getCreatedAt(), result.createdAt());
        Assertions.assertEquals(schoolClass.getName(), result.name());
    }

    @Test
    void updateShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(schoolClassRepository.findById(nonExistingSchoolClassId)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.update(nonExistingSchoolClassId, schoolClassUpdateDTO);
        });
    }

    @Test
    void deleteShouldDoNothingWhenIdExists() {
        Mockito.when(schoolClassRepository.findById(existingSchoolClassId)).thenReturn(Optional.of(schoolClass));

        Assertions.assertDoesNotThrow(() -> {
            service.delete(existingSchoolClassId);
        });
    }

    @Test
    void deleteShouldReturnConflictExceptionWhenIdExistsAndClassHasStudentsWithAnswers() {
        Mockito.when(schoolClassRepository.findById(existingSchoolClassId)).thenReturn(Optional.of(schoolClass));
        Mockito.doThrow(DataIntegrityViolationException.class).when(schoolClassRepository).delete(schoolClass);

        Assertions.assertThrows(ConflictException.class, () -> {
            service.delete(existingSchoolClassId);
        });
    }
}
