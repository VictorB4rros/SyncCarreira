package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.psychologist.PanelDTOs;
import com.synccarreira.synccarreira_api.entities.enums.ProgressStatus;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;
import com.synccarreira.synccarreira_api.services.PsychologistPanelService;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ForbiddenException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
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

import java.util.List;

@WebMvcTest(value = PsychologistPanelController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class PsychologistPanelControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PsychologistPanelService service;

    private Long existingPsychologistId, nonExistingPsychologistId, otherPsychologistId, psychologistWithoutInstitutionId;
    private PanelDTOs.PanelSummary panelSummary;

    @BeforeEach
    void setUp() {
        existingPsychologistId = 1L;
        nonExistingPsychologistId = 100L;
        otherPsychologistId = 2L;
        psychologistWithoutInstitutionId = 3L;

        PanelDTOs.TrailProgress trailProgress = new PanelDTOs.TrailProgress(
                1L, TrailName.AUTOCONHECIMENTO, 1, 5, 10, 50, false, ProgressStatus.EM_ANDAMENTO);
        PanelDTOs.StudentStatus studentStatus = new PanelDTOs.StudentStatus(
                1L, "Ana Souza", 1L, "3º ano A", 5, 10, 50, 0, 1,
                TrailName.AUTOCONHECIMENTO, false, ProgressStatus.EM_ANDAMENTO, false, null, List.of(trailProgress));
        panelSummary = new PanelDTOs.PanelSummary(1, 0, 1, 0, 0, List.of(studentStatus));
    }

    @Test
    void findPanelShouldReturnPanelSummaryWhenPsychologistExists() throws Exception {
        when(service.findPanel(existingPsychologistId)).thenReturn(panelSummary);

        ResultActions result = mockMvc.perform(get("/psychologist-panel/{psychologistId}", existingPsychologistId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.totalStudents").value(1));
        result.andExpect(jsonPath("$.inProgressStudents").value(1));
        result.andExpect(jsonPath("$.students[0].studentName").value("Ana Souza"));
        result.andExpect(jsonPath("$.students[0].journeyStatus").value("EM_ANDAMENTO"));
        result.andExpect(jsonPath("$.students[0].currentTrail").value("AUTOCONHECIMENTO"));
        result.andExpect(jsonPath("$.students[0].trails[0].trailName").value("AUTOCONHECIMENTO"));
        result.andExpect(jsonPath("$.students[0].trails[0].answeredQuestions").value(5));
        result.andExpect(jsonPath("$.students[0].trails[0].progressPercentage").value(50));
        result.andExpect(jsonPath("$.students[0].trails[0].synthesisSubmitted").value(false));
        result.andExpect(jsonPath("$.students[0].finalSynthesisSubmitted").value(false));
    }

    @Test
    void findPanelShouldReturnNotFoundWhenPsychologistDoesNotExist() throws Exception {
        when(service.findPanel(nonExistingPsychologistId)).thenThrow(ResourceNotFoundException.class);

        ResultActions result = mockMvc.perform(get("/psychologist-panel/{psychologistId}", nonExistingPsychologistId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
    }

    @Test
    void findPanelShouldReturnForbiddenWhenLoggedUserIsAnotherPsychologist() throws Exception {
        when(service.findPanel(otherPsychologistId)).thenThrow(ForbiddenException.class);

        ResultActions result = mockMvc.perform(get("/psychologist-panel/{psychologistId}", otherPsychologistId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isForbidden());
    }

    @Test
    void findPanelShouldReturnUnprocessableContentWhenPsychologistHasNoInstitution() throws Exception {
        when(service.findPanel(psychologistWithoutInstitutionId)).thenThrow(BusinessException.class);

        ResultActions result = mockMvc.perform(get("/psychologist-panel/{psychologistId}", psychologistWithoutInstitutionId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
    }
}
