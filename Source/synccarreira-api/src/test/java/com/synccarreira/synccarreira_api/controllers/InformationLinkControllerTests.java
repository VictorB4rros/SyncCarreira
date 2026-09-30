package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.InformationLinkDTO;
import com.synccarreira.synccarreira_api.dto.InformationTrailDTO;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import com.synccarreira.synccarreira_api.services.InformationLinkService;
import com.synccarreira.synccarreira_api.services.exceptions.ForbiddenException;
import com.synccarreira.synccarreira_api.tests.StudentFactory;
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

@WebMvcTest(value = InformationLinkController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class InformationLinkControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InformationLinkService service;

    @Test
    void findForLoggedStudentShouldReturnInformationTrail() throws Exception {
        InformationTrailDTO dto = new InformationTrailDTO(
                List.of(KnowledgeArea.BIOLOGICAS),
                StudentFactory.createStudentScoreDTO(),
                List.of(new InformationLinkDTO(1L, "Educação Física", "https://www.confef.org.br/", KnowledgeArea.BIOLOGICAS)),
                List.of(new InformationLinkDTO(2L, "ProUni", "https://acessounico.mec.gov.br/prouni", null)));
        when(service.findForLoggedStudent()).thenReturn(dto);

        ResultActions result = mockMvc.perform(get("/information-links/me").accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.recommendedAreas[0]").value("BIOLOGICAS"));
        result.andExpect(jsonPath("$.score.biologicalSciencesScore").value(8.25));
        result.andExpect(jsonPath("$.careerLinks[0].topic").value("Educação Física"));
        result.andExpect(jsonPath("$.careerLinks[0].url").value("https://www.confef.org.br/"));
        result.andExpect(jsonPath("$.universityAccessLinks[0].topic").value("ProUni"));
    }

    @Test
    void findForLoggedStudentShouldReturnForbiddenWhenPreviousTrailsAreNotConcluded() throws Exception {
        when(service.findForLoggedStudent()).thenThrow(ForbiddenException.class);

        ResultActions result = mockMvc.perform(get("/information-links/me").accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isForbidden());
    }
}
