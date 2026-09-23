package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.InstitutionDTO;
import com.synccarreira.synccarreira_api.dto.InstitutionInsertDTO;
import com.synccarreira.synccarreira_api.dto.InstitutionUpdateDTO;
import com.synccarreira.synccarreira_api.entities.Institution;
import com.synccarreira.synccarreira_api.repositories.InstitutionRepository;
import com.synccarreira.synccarreira_api.repositories.SchoolClassRepository;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ConflictException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.InstitutionFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class InstitutionServiceTests {

    @InjectMocks
    private InstitutionService service;

    @Mock
    private InstitutionRepository repository;

    @Mock
    private SchoolClassRepository schoolClassRepository;

    private long existingInstitutionId, nonExistingInstitutionId;
    private String nonExistingInstitutionCnpj, existingInstitutionCnpj;
    private Institution institution, institution1;
    private InstitutionInsertDTO institutionInsertDTO, invalidCnpjInstitutionInsertDTO, customCnpjInstitutionInsertDTO;
    private InstitutionUpdateDTO institutionUpdateDTO, invalidCnpjInstitutionUpdateDTO;
    private List<Institution> institutionList;

    @BeforeEach
    void setUp() {
        existingInstitutionId = 1L;
        nonExistingInstitutionId = 100L;
        nonExistingInstitutionCnpj = "33158816000105";
        existingInstitutionCnpj = "33179718000146";

        institution = InstitutionFactory.createInstitution();
        institution1 = InstitutionFactory.createInstitution();
        institutionInsertDTO = InstitutionFactory.createInstitutionInsertDTO();
        invalidCnpjInstitutionInsertDTO = InstitutionFactory.createInvalidInstitutionInsertDTO();
        institutionUpdateDTO = InstitutionFactory.createInstitutionUpdateDTO();
        invalidCnpjInstitutionUpdateDTO = InstitutionFactory.createInvalidInstitutionUpdateDTO();
        customCnpjInstitutionInsertDTO = InstitutionFactory.createCustomInstitutionInsertDTO("11111111111111");
        institution1.setId(2L);
        institution1.setLegalName("Alternative School");

        institutionList = new ArrayList<>();
        institutionList.add(institution);
        institutionList.add(institution1);
    }

    @Test
    void findAllShouldReturnInstitutionDTOList() {
        Mockito.when(repository.findAll()).thenReturn(institutionList);

        List<InstitutionDTO> result = service.findAll();

        Assertions.assertEquals(2, result.size());
        Assertions.assertEquals(institution.getId(), result.getLast().id());
        Assertions.assertEquals(institution.getLegalName(), result.getLast().legalName());
        Assertions.assertEquals(institution.getCnpj(), result.getLast().cnpj());
        Assertions.assertEquals(institution1.getId(), result.getFirst().id());
        Assertions.assertEquals(institution1.getLegalName(), result.getFirst().legalName());
        Assertions.assertEquals(institution1.getCnpj(), result.getFirst().cnpj());
    }

    @Test
    void findByIdShouldReturnInstitutionDTOWhenIdExists() {
        Mockito.when(repository.findById(existingInstitutionId)).thenReturn(Optional.of(institution));

        InstitutionDTO result = service.findById(existingInstitutionId);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(result.id(), existingInstitutionId);
        Assertions.assertEquals(result.active(), institution.getActive());
        Assertions.assertEquals(result.cnpj(), institution.getCnpj());
        Assertions.assertEquals(result.legalName(), institution.getLegalName());
    }

    @Test
    void findByIdShouldReturnResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(repository.findById(nonExistingInstitutionId)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.findById(nonExistingInstitutionId);
        });
    }

    @Test
    void createShouldReturnInstitutionDTOWhenInstitutionInsertDTOIsValid() {
        Mockito.when(repository.existsByCnpj(nonExistingInstitutionCnpj)).thenReturn(false);
        Mockito.when(repository.save(any())).thenReturn(institution);

        InstitutionDTO result = service.create(institutionInsertDTO);
        Assertions.assertNotNull(result);
        Assertions.assertEquals(institution.getId(), result.id());
        Assertions.assertEquals(institution.getLegalName(), result.legalName());
        Assertions.assertEquals(institution.getCnpj(), result.cnpj());
    }

    @Test
    void createShouldReturnBusinessExceptionWhenCnpjIsInvalid() {
        Assertions.assertThrows(BusinessException.class, () -> {
            service.create(customCnpjInstitutionInsertDTO);
        });
    }

    @Test
    void createShouldReturnConflictExceptionWhenInstitutionCnpjAlreadyExists() {
        Mockito.when(repository.existsByCnpj(existingInstitutionCnpj)).thenReturn(true);

        Assertions.assertThrows(ConflictException.class, () -> {
            service.create(invalidCnpjInstitutionInsertDTO);
        });
    }

    @Test
    void updateShouldReturnInstitutionDTOWhenIdExistsAndCnpjIsValid() {
        Mockito.when(repository.findById(existingInstitutionId)).thenReturn(Optional.of(institution));
        Mockito.when(repository.findByCnpj(nonExistingInstitutionCnpj)).thenReturn(Optional.empty());
        Mockito.when(repository.save(any())).thenReturn(institution);

        InstitutionDTO result = service.update(existingInstitutionId, institutionUpdateDTO);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(institution.getId(), result.id());
        Assertions.assertEquals(institution.getCnpj(), result.cnpj());
        Assertions.assertEquals(institution.getLegalName(), result.legalName());
        Assertions.assertEquals(institution.getTradeName(), result.tradeName());
    }

    @Test
    void updateShouldReturnConflictExceptionWhenCnpjBelongsToAnotherInstitution() {
        institution.setId(2L);
        Mockito.when(repository.findById(existingInstitutionId)).thenReturn(Optional.of(institution));
        Mockito.when(repository.findByCnpj(existingInstitutionCnpj)).thenReturn(Optional.of(institution));

        Assertions.assertThrows(ConflictException.class, () -> {
            service.update(existingInstitutionId, invalidCnpjInstitutionUpdateDTO);
        });
    }

    @Test
    void deleteShouldDoNothingWhenIdExistsAndInstitutionHasNoClasses() {
        Mockito.when(repository.findById(existingInstitutionId)).thenReturn(Optional.of(institution));
        Mockito.when(schoolClassRepository.existsByInstitutionId(existingInstitutionId)).thenReturn(false);

        Assertions.assertDoesNotThrow(() -> {
            service.delete(existingInstitutionId);
        });
    }

    @Test
    void deleteShouldReturnConflictExceptionWhenIdExistsAndInstitutionHasClasses() {
        Mockito.when(repository.findById(existingInstitutionId)).thenReturn(Optional.of(institution));
        Mockito.when(schoolClassRepository.existsByInstitutionId(existingInstitutionId)).thenReturn(true);

        Assertions.assertThrows(ConflictException.class, () -> {
            service.delete(existingInstitutionId);
        });
    }
}
