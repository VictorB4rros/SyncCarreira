package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.SchoolClassDTO;
import com.synccarreira.synccarreira_api.services.SchoolClassService;
import com.synccarreira.synccarreira_api.tests.SchoolClassFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.ArrayList;
import java.util.List;

@WebMvcTest(value = SchoolClassController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class SchoolClassControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SchoolClassService service;

    private Long existingInstitutionId;
    private List<SchoolClassDTO> dtoList;
    private SchoolClassDTO dto1, dto2;

    @BeforeEach
    void setUp() throws Exception {
        existingInstitutionId = 1L;

        dto1 = SchoolClassFactory.createSchoolClassDTO();
        dto2 = SchoolClassFactory.createSchoolClassDTO();

        dtoList = new ArrayList<>();
        dtoList.add(dto1);
        dtoList.add(dto2);
    }

    @Test
    public void findAllShouldReturnSchoolClassDTOList() throws Exception {
        when(service.findAll()).thenReturn(dtoList);

        ResultActions result = mockMvc.perform(get("/classes")
                        .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$[0].id").value(1));
        result.andExpect(jsonPath("$[0].name").value("3º ano A"));
        result.andExpect(jsonPath("$[0].schoolYear").value(2026));
        result.andExpect(jsonPath("$[0].createdAt").exists());
        result.andExpect(jsonPath("$[1].id").value(1));
        result.andExpect(jsonPath("$[1].name").value("3º ano A"));
        result.andExpect(jsonPath("$[1].schoolYear").value(2026));
        result.andExpect(jsonPath("$[1].createdAt").exists());
    }

    @Test
    public void findAllShouldReturnSchoolClassDTOListWhenInstitutionIdExists() throws Exception {
        when(service.findByInstitutionId(existingInstitutionId)).thenReturn(dtoList);

        ResultActions result = mockMvc.perform(get("/classes?institutionId={id}", existingInstitutionId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$[0].id").value(1));
        result.andExpect(jsonPath("$[0].name").value("3º ano A"));
        result.andExpect(jsonPath("$[0].schoolYear").value(2026));
        result.andExpect(jsonPath("$[0].createdAt").exists());
        result.andExpect(jsonPath("$[1].id").value(1));
        result.andExpect(jsonPath("$[1].name").value("3º ano A"));
        result.andExpect(jsonPath("$[1].schoolYear").value(2026));
        result.andExpect(jsonPath("$[1].createdAt").exists());
    }
}
