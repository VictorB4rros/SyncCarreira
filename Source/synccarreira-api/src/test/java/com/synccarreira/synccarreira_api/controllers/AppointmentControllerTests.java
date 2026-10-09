package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.AppointmentCancelDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentFeedbackDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentInsertDTO;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleStatus;
import com.synccarreira.synccarreira_api.services.AppointmentService;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ForbiddenException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.AppointmentFactory;
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

import java.util.List;

@WebMvcTest(value = AppointmentController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class AppointmentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AppointmentService service;

    private Long existingAppointmentId, nonExistingAppointmentId, existingPsychologistId, otherPsychologistId, existingStudentId;
    private AppointmentDTO appointmentDTO, canceledAppointmentDTO, completedAppointmentDTO;
    private AppointmentInsertDTO appointmentInsertDTO, invalidAppointmentInsertDTO;
    private AppointmentCancelDTO appointmentCancelDTO, invalidAppointmentCancelDTO;
    private AppointmentFeedbackDTO appointmentFeedbackDTO, invalidAppointmentFeedbackDTO;
    private List<AppointmentDTO> dtoList;

    @BeforeEach
    void setUp() {
        existingAppointmentId = 1L;
        nonExistingAppointmentId = 100L;
        existingPsychologistId = 1L;
        otherPsychologistId = 2L;
        existingStudentId = 1L;

        appointmentDTO = AppointmentFactory.createAppointmentDTO();
        canceledAppointmentDTO = AppointmentFactory.createAppointmentDTOWithStatus(ScheduleStatus.CANCELADA);
        completedAppointmentDTO = AppointmentFactory.createAppointmentDTOWithStatus(ScheduleStatus.REALIZADA);
        appointmentInsertDTO = AppointmentFactory.createIndividualAppointmentInsertDTO();
        invalidAppointmentInsertDTO = AppointmentFactory.createInvalidAppointmentInsertDTO();
        appointmentCancelDTO = AppointmentFactory.createAppointmentCancelDTO();
        invalidAppointmentCancelDTO = AppointmentFactory.createInvalidAppointmentCancelDTO();
        appointmentFeedbackDTO = AppointmentFactory.createAppointmentFeedbackDTO();
        invalidAppointmentFeedbackDTO = AppointmentFactory.createInvalidAppointmentFeedbackDTO();

        dtoList = List.of(appointmentDTO);
    }

    @Test
    void findByPsychologistShouldReturnAppointmentDTOList() throws Exception {
        when(service.findByPsychologist(existingPsychologistId)).thenReturn(dtoList);

        ResultActions result = mockMvc.perform(get("/appointments/psychologist/{id}", existingPsychologistId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$[0].id").value(1));
        result.andExpect(jsonPath("$[0].title").value("Conversa sobre a trilha Autoconhecimento"));
        result.andExpect(jsonPath("$[0].durationMinutes").value(50));
        result.andExpect(jsonPath("$[0].scheduleType").value("INDIVIDUAL"));
        result.andExpect(jsonPath("$[0].scheduleStatus").value("AGENDADA"));
        result.andExpect(jsonPath("$[0].dateTime").exists());
        result.andExpect(jsonPath("$[0].psychologist.id").value(1));
        result.andExpect(jsonPath("$[0].psychologist.name").value("Lorena Souza"));
        result.andExpect(jsonPath("$[0].students[0].id").value(1));
        result.andExpect(jsonPath("$[0].students[0].name").value("Ana Souza"));
        result.andExpect(jsonPath("$[0].meetLink").value("https://meet.google.com/abc-defg-hij"));
    }

    @Test
    void findByPsychologistShouldReturnForbiddenWhenAccessingAnotherPsychologistAgenda() throws Exception {
        when(service.findByPsychologist(otherPsychologistId))
                .thenThrow(new ForbiddenException("Acesso negado: só é permitido acessar a própria agenda."));

        ResultActions result = mockMvc.perform(get("/appointments/psychologist/{id}", otherPsychologistId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isForbidden());
        result.andExpect(jsonPath("$.status").value(403));
        result.andExpect(jsonPath("$.error").value("Acesso negado: só é permitido acessar a própria agenda."));
    }

    @Test
    void findByStudentShouldReturnAppointmentDTOList() throws Exception {
        when(service.findByStudent(existingStudentId)).thenReturn(dtoList);

        ResultActions result = mockMvc.perform(get("/appointments/student/{id}", existingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$[0].id").value(1));
        result.andExpect(jsonPath("$[0].title").value("Conversa sobre a trilha Autoconhecimento"));
        result.andExpect(jsonPath("$[0].scheduleStatus").value("AGENDADA"));
        result.andExpect(jsonPath("$[0].students[0].id").value(1));
        result.andExpect(jsonPath("$[0].students[0].email").value("ana.souza@gmail.com"));
    }

    @Test
    void findByStudentShouldReturnEmptyListWhenStudentHasNoAppointments() throws Exception {
        when(service.findByStudent(existingStudentId)).thenReturn(List.of());

        ResultActions result = mockMvc.perform(get("/appointments/student/{id}", existingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void insertShouldReturnCreatedAndAppointmentDTOWhenDataIsValid() throws Exception {
        when(service.insert(any())).thenReturn(appointmentDTO);
        String jsonBody = objectMapper.writeValueAsString(appointmentInsertDTO);

        ResultActions result = mockMvc.perform(post("/appointments")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isCreated());
        result.andExpect(header().string("Location", "http://localhost/appointments/1"));
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.title").value("Conversa sobre a trilha Autoconhecimento"));
        result.andExpect(jsonPath("$.scheduleStatus").value("AGENDADA"));
    }

    @Test
    void insertShouldReturnUnprocessableEntityWhenDataIsInvalid() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidAppointmentInsertDTO);

        ResultActions result = mockMvc.perform(post("/appointments")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'title')].message").value("Campo obrigatório"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'dateTime')].message").value("A data da sessão deve estar no futuro"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'durationMinutes')].message").value("Duração inválida"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'scheduleType')].message").value("Campo obrigatório"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'psychologistId')].message").value("Campo obrigatório"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'studentIds')].message").value("Informe ao menos um aluno"));
        verify(service, never()).insert(any());
    }

    @Test
    void insertShouldReturnNotFoundWhenPsychologistDoesNotExist() throws Exception {
        when(service.insert(any())).thenThrow(new ResourceNotFoundException("Psicóloga não encontrada. ID: 1"));
        String jsonBody = objectMapper.writeValueAsString(appointmentInsertDTO);

        ResultActions result = mockMvc.perform(post("/appointments")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
        result.andExpect(jsonPath("$.error").value("Psicóloga não encontrada. ID: 1"));
    }

    @Test
    void insertShouldReturnUnprocessableEntityWhenStudentCountDoesNotMatchScheduleType() throws Exception {
        when(service.insert(any())).thenThrow(new BusinessException("Sessões individuais devem ter exatamente 1 aluno."));
        String jsonBody = objectMapper.writeValueAsString(appointmentInsertDTO);

        ResultActions result = mockMvc.perform(post("/appointments")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.error").value("Sessões individuais devem ter exatamente 1 aluno."));
    }

    @Test
    void updateShouldReturnAppointmentDTOWhenIdExists() throws Exception {
        when(service.update(eq(existingAppointmentId), any())).thenReturn(appointmentDTO);
        String jsonBody = objectMapper.writeValueAsString(appointmentInsertDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.title").value("Conversa sobre a trilha Autoconhecimento"));
        result.andExpect(jsonPath("$.scheduleStatus").value("AGENDADA"));
    }

    @Test
    void updateShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        when(service.update(eq(nonExistingAppointmentId), any()))
                .thenThrow(new ResourceNotFoundException("Agendamento não encontrado. ID: " + nonExistingAppointmentId));
        String jsonBody = objectMapper.writeValueAsString(appointmentInsertDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}", nonExistingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
        result.andExpect(jsonPath("$.error").value("Agendamento não encontrado. ID: 100"));
    }

    @Test
    void updateShouldReturnConflictWhenAppointmentIsNotScheduled() throws Exception {
        when(service.update(eq(existingAppointmentId), any()))
                .thenThrow(new IllegalStateException("Apenas sessões agendadas podem ser editadas. Status atual: CANCELADA."));
        String jsonBody = objectMapper.writeValueAsString(appointmentInsertDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isConflict());
        result.andExpect(jsonPath("$.status").value(409));
        result.andExpect(jsonPath("$.error").value("Apenas sessões agendadas podem ser editadas. Status atual: CANCELADA."));
    }

    @Test
    void updateShouldReturnUnprocessableEntityWhenDataIsInvalid() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidAppointmentInsertDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        verify(service, never()).update(any(), any());
    }

    @Test
    void cancelShouldReturnAppointmentDTOWhenIdExists() throws Exception {
        when(service.cancel(eq(existingAppointmentId), any())).thenReturn(canceledAppointmentDTO);
        String jsonBody = objectMapper.writeValueAsString(appointmentCancelDTO);

        ResultActions result = mockMvc.perform(patch("/appointments/{id}/cancel", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.scheduleStatus").value("CANCELADA"));
    }

    @Test
    void cancelShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        when(service.cancel(eq(nonExistingAppointmentId), any()))
                .thenThrow(new ResourceNotFoundException("Agendamento não encontrado. ID: " + nonExistingAppointmentId));
        String jsonBody = objectMapper.writeValueAsString(appointmentCancelDTO);

        ResultActions result = mockMvc.perform(patch("/appointments/{id}/cancel", nonExistingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void cancelShouldReturnConflictWhenAppointmentIsNotScheduled() throws Exception {
        when(service.cancel(eq(existingAppointmentId), any()))
                .thenThrow(new IllegalStateException("Apenas sessões agendadas podem ser canceladas. Status atual: REALIZADA."));
        String jsonBody = objectMapper.writeValueAsString(appointmentCancelDTO);

        ResultActions result = mockMvc.perform(patch("/appointments/{id}/cancel", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isConflict());
        result.andExpect(jsonPath("$.error").value("Apenas sessões agendadas podem ser canceladas. Status atual: REALIZADA."));
    }

    @Test
    void cancelShouldReturnUnprocessableEntityWhenCancelReasonIsBlank() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidAppointmentCancelDTO);

        ResultActions result = mockMvc.perform(patch("/appointments/{id}/cancel", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'cancelReason')].message").value("Campo obrigatório"));
        verify(service, never()).cancel(any(), any());
    }

    @Test
    void registerFeedbackShouldReturnAppointmentDTOWhenIdExists() throws Exception {
        when(service.registerFeedback(eq(existingAppointmentId), any())).thenReturn(completedAppointmentDTO);
        String jsonBody = objectMapper.writeValueAsString(appointmentFeedbackDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}/feedback", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.scheduleStatus").value("REALIZADA"));
    }

    @Test
    void registerFeedbackShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        when(service.registerFeedback(eq(nonExistingAppointmentId), any()))
                .thenThrow(new ResourceNotFoundException("Agendamento não encontrado. ID: " + nonExistingAppointmentId));
        String jsonBody = objectMapper.writeValueAsString(appointmentFeedbackDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}/feedback", nonExistingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void registerFeedbackShouldReturnConflictWhenAppointmentIsCanceled() throws Exception {
        when(service.registerFeedback(eq(existingAppointmentId), any()))
                .thenThrow(new IllegalStateException("Não é possível registrar feedback de uma sessão cancelada."));
        String jsonBody = objectMapper.writeValueAsString(appointmentFeedbackDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}/feedback", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isConflict());
        result.andExpect(jsonPath("$.error").value("Não é possível registrar feedback de uma sessão cancelada."));
    }

    @Test
    void registerFeedbackShouldReturnUnprocessableEntityWhenFeedbackIsBlank() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidAppointmentFeedbackDTO);

        ResultActions result = mockMvc.perform(put("/appointments/{id}/feedback", existingAppointmentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'feedback')].message").value("Campo obrigatório"));
        verify(service, never()).registerFeedback(any(), any());
    }
}
