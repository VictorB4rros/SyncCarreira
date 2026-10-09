package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.SynthesisDTO;
import com.synccarreira.synccarreira_api.dto.SynthesisInsertDTO;
import com.synccarreira.synccarreira_api.services.SynthesisService;
import com.synccarreira.synccarreira_api.services.exceptions.ConflictException;
import com.synccarreira.synccarreira_api.services.exceptions.ForbiddenException;
import com.synccarreira.synccarreira_api.tests.SynthesisFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@WebMvcTest(value = SynthesisController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class SynthesisControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SynthesisService service;

    @Test
    void findForLoggedStudentShouldReturnSyntheses() throws Exception {
        when(service.findForLoggedStudent()).thenReturn(List.of(SynthesisFactory.createSynthesisDTO()));

        ResultActions result = mockMvc.perform(get("/syntheses/me").accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$[0].content").value(SynthesisFactory.CONTENT));
        result.andExpect(jsonPath("$[0].trailName").value("AUTOCONHECIMENTO"));
        result.andExpect(jsonPath("$[0].journeySynthesis").value(false));
    }

    @Test
    void insertShouldReturnCreatedWhenDataIsValid() throws Exception {
        SynthesisDTO dto = SynthesisFactory.createSynthesisDTO();
        when(service.insert(any())).thenReturn(dto);
        String jsonBody = objectMapper.writeValueAsString(SynthesisFactory.createSynthesisInsertDTO(1L));

        ResultActions result = mockMvc.perform(post("/syntheses")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isCreated());
        result.andExpect(header().exists("Location"));
        result.andExpect(jsonPath("$.id").value(dto.id()));
        result.andExpect(jsonPath("$.trailId").value(1L));
    }

    @Test
    void insertShouldReturnUnprocessableContentWhenContentIsBlank() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(new SynthesisInsertDTO(1L, "   "));

        ResultActions result = mockMvc.perform(post("/syntheses")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.errors[0].fieldName").value("content"));
    }

    @Test
    void insertShouldReturnUnprocessableContentWhenContentIsTooLong() throws Exception {
        String content = "a".repeat(SynthesisInsertDTO.MAX_CONTENT_LENGTH + 1);
        String jsonBody = objectMapper.writeValueAsString(new SynthesisInsertDTO(1L, content));

        ResultActions result = mockMvc.perform(post("/syntheses")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
    }

    @Test
    void insertShouldReturnForbiddenWhenTrailIsNotUnlocked() throws Exception {
        when(service.insert(any())).thenThrow(ForbiddenException.class);
        String jsonBody = objectMapper.writeValueAsString(SynthesisFactory.createSynthesisInsertDTO(2L));

        ResultActions result = mockMvc.perform(post("/syntheses")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isForbidden());
    }

    @Test
    void insertShouldReturnConflictWhenSynthesisWasAlreadySubmitted() throws Exception {
        when(service.insert(any())).thenThrow(ConflictException.class);
        String jsonBody = objectMapper.writeValueAsString(SynthesisFactory.createSynthesisInsertDTO(1L));

        ResultActions result = mockMvc.perform(post("/syntheses")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isConflict());
    }
}
