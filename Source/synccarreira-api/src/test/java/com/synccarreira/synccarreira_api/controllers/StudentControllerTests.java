package com.synccarreira.synccarreira_api.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.synccarreira.synccarreira_api.dto.StudentDTO;
import com.synccarreira.synccarreira_api.dto.StudentDetailsDTO;
import com.synccarreira.synccarreira_api.dto.StudentInsertDTO;
import com.synccarreira.synccarreira_api.dto.StudentScoreDTO;
import com.synccarreira.synccarreira_api.services.StudentService;
import com.synccarreira.synccarreira_api.services.exceptions.DatabaseException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.StudentFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@WebMvcTest(value = StudentController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
public class StudentControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private StudentService service;

    private Long existingStudentId, nonExistingStudentId, dependentStudentId, existingSchoolClassId;
    private StudentDTO studentDTO;
    private StudentInsertDTO studentInsertDTO, studentUpdateDTO, invalidStudentInsertDTO;
    private StudentScoreDTO studentScoreDTO;
    private Page<StudentDetailsDTO> studentDetailsPage;

    @BeforeEach
    void setUp() throws Exception {
        existingStudentId = 1L;
        nonExistingStudentId = 100L;
        dependentStudentId = 2L;
        existingSchoolClassId = 1L;

        studentDTO = StudentFactory.createStudentDTO();
        studentInsertDTO = StudentFactory.createStudentInsertDTO();
        studentUpdateDTO = StudentFactory.createStudentUpdateDTO();
        invalidStudentInsertDTO = StudentFactory.createInvalidStudentInsertDTO();
        studentScoreDTO = StudentFactory.createStudentScoreDTO();
        studentDetailsPage = new PageImpl<>(List.of(StudentFactory.createStudentDetailsDTO()), PageRequest.of(0, 10), 1);
    }

    @Test
    public void findAllShouldReturnStudentDetailsDTOPage() throws Exception {
        when(service.findAll(any())).thenReturn(studentDetailsPage);

        ResultActions result = mockMvc.perform(get("/students?page=0&size=10")
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.content[0].id").value(1));
        result.andExpect(jsonPath("$.content[0].name").value("Ana Souza"));
        result.andExpect(jsonPath("$.content[0].email").value("ana.souza@gmail.com"));
        result.andExpect(jsonPath("$.content[0].className").value("3º A"));
        result.andExpect(jsonPath("$.content[0].institutionName").value("Escola Estadual Central"));
    }

    @Test
    public void findByIdShouldReturnStudentDTOWhenIdExists() throws Exception {
        when(service.findById(existingStudentId)).thenReturn(studentDTO);

        ResultActions result = mockMvc.perform(get("/students/{id}", existingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.name").value("Ana Souza"));
        result.andExpect(jsonPath("$.email").value("ana.souza@gmail.com"));
        result.andExpect(jsonPath("$.schollarYear").value("3º ano do Ensino Médio"));
        result.andExpect(jsonPath("$.schoolType").value("Pública"));
        result.andExpect(jsonPath("$.race").value("Parda"));
        result.andExpect(jsonPath("$.roles[0].authority").value("ROLE_USER"));
    }

    @Test
    public void findByIdShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        when(service.findById(nonExistingStudentId)).thenThrow(new ResourceNotFoundException("Recurso não encontrado"));

        ResultActions result = mockMvc.perform(get("/students/{id}", nonExistingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
        result.andExpect(jsonPath("$.error").value("Recurso não encontrado"));
    }

    @Test
    public void insertShouldReturnCreatedAndStudentDTOWhenDataIsValid() throws Exception {
        when(service.insert(any())).thenReturn(studentDTO);
        String jsonBody = objectMapper.writeValueAsString(studentInsertDTO);

        ResultActions result = mockMvc.perform(post("/students")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isCreated());
        result.andExpect(header().string("Location", "http://localhost/students/1"));
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.name").value("Ana Souza"));
        result.andExpect(jsonPath("$.email").value("ana.souza@gmail.com"));
    }

    @Test
    public void insertShouldReturnUnprocessableEntityWhenDataIsInvalid() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidStudentInsertDTO);

        ResultActions result = mockMvc.perform(post("/students")
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'name')].message").value("Campo obrigatório"));
        result.andExpect(jsonPath("$.errors[?(@.fieldName == 'email')].message").value("Favor entrar com email válido"));
        verify(service, never()).insert(any());
    }

    @Test
    public void updateShouldReturnStudentDTOWhenIdExists() throws Exception {
        when(service.update(eq(existingStudentId), any())).thenReturn(studentDTO);
        String jsonBody = objectMapper.writeValueAsString(studentUpdateDTO);

        ResultActions result = mockMvc.perform(put("/students/{id}", existingStudentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.id").value(1));
        result.andExpect(jsonPath("$.name").value("Ana Souza"));
        result.andExpect(jsonPath("$.email").value("ana.souza@gmail.com"));
    }

    @Test
    public void updateShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        when(service.update(eq(nonExistingStudentId), any())).thenThrow(new ResourceNotFoundException("Resource not found"));
        String jsonBody = objectMapper.writeValueAsString(studentUpdateDTO);

        ResultActions result = mockMvc.perform(put("/students/{id}", nonExistingStudentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
    }

    @Test
    public void updateShouldReturnUnprocessableEntityWhenDataIsInvalid() throws Exception {
        String jsonBody = objectMapper.writeValueAsString(invalidStudentInsertDTO);

        ResultActions result = mockMvc.perform(put("/students/{id}", existingStudentId)
                .content(jsonBody)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isUnprocessableContent());
        verify(service, never()).update(any(), any());
    }

    @Test
    public void deleteShouldReturnNoContentWhenIdExists() throws Exception {
        ResultActions result = mockMvc.perform(delete("/students/{id}", existingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNoContent());
        verify(service).delete(existingStudentId);
    }

    @Test
    public void deleteShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        doThrow(new ResourceNotFoundException("Resource not found")).when(service).delete(nonExistingStudentId);

        ResultActions result = mockMvc.perform(delete("/students/{id}", nonExistingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.status").value(404));
    }

    @Test
    public void deleteShouldReturnBadRequestWhenStudentHasDependentData() throws Exception {
        doThrow(new DatabaseException("Referential integrity failure")).when(service).delete(dependentStudentId);

        ResultActions result = mockMvc.perform(delete("/students/{id}", dependentStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isBadRequest());
        result.andExpect(jsonPath("$.error").value("Referential integrity failure"));
    }

    @Test
    public void getScoreShouldReturnStudentScoreDTOWhenIdExists() throws Exception {
        when(service.getScore(existingStudentId)).thenReturn(studentScoreDTO);

        ResultActions result = mockMvc.perform(get("/students/{id}/score", existingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isOk());
        result.andExpect(jsonPath("$.studentId").value(1));
        result.andExpect(jsonPath("$.humanitiesScore").value(7.5));
        result.andExpect(jsonPath("$.exactSciencesScore").value(6.0));
        result.andExpect(jsonPath("$.biologicalSciencesScore").value(8.25));
        result.andExpect(jsonPath("$.artsScore").value(5.0));
    }

    @Test
    public void getScoreShouldReturnNotFoundWhenIdDoesNotExist() throws Exception {
        when(service.getScore(nonExistingStudentId)).thenThrow(new ResourceNotFoundException("Student not found. ID: " + nonExistingStudentId));

        ResultActions result = mockMvc.perform(get("/students/{id}/score", nonExistingStudentId)
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNotFound());
        result.andExpect(jsonPath("$.error").value("Student not found. ID: 100"));
    }

    @Test
    public void setSchoolClassShouldReturnNoContent() throws Exception {
        ResultActions result = mockMvc.perform(patch("/students/class")
                .param("studentId", existingStudentId.toString())
                .param("classId", existingSchoolClassId.toString())
                .accept(MediaType.APPLICATION_JSON));

        result.andExpect(status().isNoContent());
        verify(service).setSchoolClass(existingStudentId, existingSchoolClassId);
    }
}
