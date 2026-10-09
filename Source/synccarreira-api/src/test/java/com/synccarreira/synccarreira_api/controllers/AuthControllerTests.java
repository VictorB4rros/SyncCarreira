package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.NewPasswordDTO;
import com.synccarreira.synccarreira_api.services.AuthService;
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
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(value = AuthController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService service;

    private String validToken, invalidToken, newPassword, shortPassword;
    private NewPasswordDTO validNewPasswordDTO, invalidTokenNewPasswordDTO, invalidNewPasswordDTO;

    @BeforeEach
    void setUp() throws Exception {
        validToken = "3f1c9a2e-7b4d-4e8a-9c6f-1d2b3a4c5e6f";
        invalidToken = "00000000-0000-0000-0000-000000000000";
        newPassword = "novaSenha123";
        shortPassword = "123";

        validNewPasswordDTO = new NewPasswordDTO(validToken, newPassword);
        invalidTokenNewPasswordDTO = new NewPasswordDTO(invalidToken, newPassword);
        invalidNewPasswordDTO = new NewPasswordDTO("", shortPassword);
    }

    @Test
    public void saveNewPasswordShouldReturnNoContentWhenTokenIsValid() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(validNewPasswordDTO);

        ResultActions result = mockMvc.perform(put("/auth/new-password")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNoContent());
        verify(service).saveNewPassword(any());
    }

    @Test
    public void saveNewPasswordShouldReturnNotFoundWhenTokenIsInvalid() throws Exception {
        doThrow(new ResourceNotFoundException("Token inválido")).when(service).saveNewPassword(any());
        String jsonBody = objectMapper.writeValueAsString(invalidTokenNewPasswordDTO);

        ResultActions result = mockMvc.perform(put("/auth/new-password")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
        result.andExpect(jsonPath("$.error").value("Token inválido"));
        result.andExpect(jsonPath("$.path").value("/auth/new-password"));
    }

    @Test
    public void saveNewPasswordShouldReturnUnprocessableEntityWhenDataIsInvalid() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidNewPasswordDTO);

        ResultActions result = mockMvc.perform(put("/auth/new-password")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'token')].message").value("Campo obrigatório"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'password')].message").value("Deve ter no mínimo 8 caracteres"));
        verify(service, never()).saveNewPassword(any());
    }
}
