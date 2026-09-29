package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.*;
import com.synccarreira.synccarreira_api.services.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping(value = "/appointments")
@Tag(name = "Agendamentos", description = "Endpoints para interagir com os agendamentos de sessões.")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(final AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/psychologist/{id}")
    @Operation(summary = "Busca os agendamentos de um(a) psicólogo(a).")
    @ApiResponse(
            responseCode = "200",
            description = "Agendamentos encontrados com sucesso."
    )
    public ResponseEntity<List<AppointmentDTO>> findByPsychologist(
            @Parameter(description = "Id do(a) psicólogo(a).", required = true)
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(appointmentService.findByPsychologist(id));
    }

    @GetMapping("/student/{id}")
    @Operation(summary = "Busca os agendamentos dos quais um aluno participa.")
    @ApiResponse(
            responseCode = "200",
            description = "Agendamentos encontrados com sucesso."
    )
    public ResponseEntity<List<AppointmentDTO>> findByStudent(
            @Parameter(description = "Id do aluno.", required = true)
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(appointmentService.findByStudent(id));
    }

    @PostMapping
    @Operation(summary = "Cria um novo agendamento.")
    @ApiResponse(
            responseCode = "201",
            description = "Agendamento criado com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = AppointmentDTO.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Psicóloga ou aluno não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "409",
            description = "Contrato da psicóloga vencido.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "422",
            description = "Dados inválidos.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = ValidationError.class)) }
    )
    public ResponseEntity<AppointmentDTO> insert(@Valid @RequestBody AppointmentInsertDTO dto) {
        AppointmentDTO result = appointmentService.insert(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.id()).toUri();
        return ResponseEntity.created(uri).body(result);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um agendamento pelo id.")
    @ApiResponse(
            responseCode = "200",
            description = "Agendamento atualizado com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = AppointmentDTO.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Recurso não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "409",
            description = "Sessão não está agendada ou contrato da psicóloga vencido.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "422",
            description = "Dados inválidos.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = ValidationError.class)) }
    )
    public ResponseEntity<AppointmentDTO> update(
            @Parameter(description = "Id do agendamento.", required = true)
            @PathVariable Long id,
            @Valid @RequestBody AppointmentInsertDTO dto
    ) {
        return ResponseEntity.ok(appointmentService.update(id, dto));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancela um agendamento.")
    @ApiResponse(
            responseCode = "200",
            description = "Agendamento cancelado com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = AppointmentDTO.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Agendamento não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "409",
            description = "Sessão já cancelada ou realizada.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<AppointmentDTO> cancel(
            @Parameter(description = "Id do agendamento.", required = true)
            @PathVariable Long id,
            @Valid @RequestBody AppointmentCancelDTO dto
    ) {
        return ResponseEntity.ok(appointmentService.cancel(id, dto));
    }

    @PutMapping("/{id}/feedback")
    @Operation(summary = "Registra o feedback de uma sessão e a marca como realizada.")
    @ApiResponse(
            responseCode = "200",
            description = "Feedback registrado com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = AppointmentDTO.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Agendamento não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "409",
            description = "Sessão cancelada.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<AppointmentDTO> registerFeedback(
            @Parameter(description = "Id do agendamento.", required = true)
            @PathVariable Long id,
            @Valid @RequestBody AppointmentFeedbackDTO dto
    ) {
        return ResponseEntity.ok(appointmentService.registerFeedback(id, dto));
    }
}
