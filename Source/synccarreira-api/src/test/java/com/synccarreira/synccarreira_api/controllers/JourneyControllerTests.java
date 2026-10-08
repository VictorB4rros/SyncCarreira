package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.JourneyDoubtDTO;
import com.synccarreira.synccarreira_api.services.JourneyService;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ConflictException;
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

import java.time.Instant;

@WebMvcTest(value = JourneyController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class JourneyControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JourneyService service;

    private Long existingStudentId;
    private Instant doubtFlaggedAt;
    private JourneyDoubtDTO notInDoubtDTO, inDoubtDTO;

    @BeforeEach
    void setUp() throws Exception {
        existingStudentId = 1L;
        doubtFlaggedAt = Instant.parse("2026-10-01T13:30:00Z");

        notInDoubtDTO = new JourneyDoubtDTO(existingStudentId, false, null);
        inDoubtDTO = new JourneyDoubtDTO(existingStudentId, true, doubtFlaggedAt);
    }

    @Test
    public void findDoubtShouldReturnJourneyDoubtDTOWhenStudentHasNotFlaggedDoubt() throws Exception {
        when(service.findDoubt()).thenReturn(notInDoubtDTO);

        ResultActions result = mockMvc.perform(get("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.studentId").value(1));
        result.andExpect(jsonPath("$.inDoubt").value(false));
        result.andExpect(jsonPath("$.doubtFlaggedAt").doesNotExist());
    }

    @Test
    public void findDoubtShouldReturnJourneyDoubtDTOWhenStudentHasFlaggedDoubt() throws Exception {
        when(service.findDoubt()).thenReturn(inDoubtDTO);

        ResultActions result = mockMvc.perform(get("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.studentId").value(1));
        result.andExpect(jsonPath("$.inDoubt").value(true));
        result.andExpect(jsonPath("$.doubtFlaggedAt").exists());
    }

    @Test
    public void findDoubtShouldReturnNotFoundWhenStudentDoesNotExist() throws Exception {
        when(service.findDoubt()).thenThrow(ResourceNotFoundException.class);

        ResultActions result = mockMvc.perform(get("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
    }

    @Test
    public void flagDoubtShouldReturnJourneyDoubtDTOWhenJourneyIsConcluded() throws Exception {
        when(service.flagDoubt()).thenReturn(inDoubtDTO);

        ResultActions result = mockMvc.perform(post("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.studentId").value(1));
        result.andExpect(jsonPath("$.inDoubt").value(true));
        result.andExpect(jsonPath("$.doubtFlaggedAt").exists());
    }

    @Test
    public void flagDoubtShouldReturnNotFoundWhenStudentDoesNotExist() throws Exception {
        when(service.flagDoubt()).thenThrow(ResourceNotFoundException.class);

        ResultActions result = mockMvc.perform(post("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
    }

    @Test
    public void flagDoubtShouldReturnConflictWhenDoubtWasAlreadyFlagged() throws Exception {
        when(service.flagDoubt()).thenThrow(ConflictException.class);

        ResultActions result = mockMvc.perform(post("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isConflict());
    }

    @Test
    public void flagDoubtShouldReturnUnprocessableContentWhenJourneyIsNotConcluded() throws Exception {
        when(service.flagDoubt()).thenThrow(BusinessException.class);

        ResultActions result = mockMvc.perform(post("/journey/doubt")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
    }
}
