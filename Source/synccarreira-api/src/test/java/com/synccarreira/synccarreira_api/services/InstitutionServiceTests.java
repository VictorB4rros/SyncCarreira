package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.InstitutionDTO;
import com.synccarreira.synccarreira_api.entities.Institution;
import com.synccarreira.synccarreira_api.repositories.InstitutionRepository;
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

@ExtendWith(MockitoExtension.class)
public class InstitutionServiceTests {

    @InjectMocks
    private InstitutionService service;

    @Mock
    private InstitutionRepository repository;

    private Institution institution, institution1;
    private List<Institution> institutionList;

    @BeforeEach
    void setUp() {
        institution = InstitutionFactory.createInstitution();
        institution1 = InstitutionFactory.createInstitution();
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
}
