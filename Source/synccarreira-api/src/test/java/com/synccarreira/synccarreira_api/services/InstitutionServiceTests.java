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

    private Institution institution;
    private List<Institution> institutionList;

    @BeforeEach
    void setUp() {
        institution = InstitutionFactory.createInstitution();

        institutionList = new ArrayList<>();
        institutionList.add(institution);

        Mockito.when(repository.findAll()).thenReturn(institutionList);
    }

    @Test
    void findAllShouldReturnInstitutionDTOList() {
        List<InstitutionDTO> result = service.findAll();

        Assertions.assertEquals(1, result.size());
        Assertions.assertEquals(institution.getId(), result.getFirst().id());
        Assertions.assertEquals(institution.getLegalName(), result.getFirst().legalName());
        Assertions.assertEquals(institution.getCnpj(), result.getFirst().cnpj());
    }
}
