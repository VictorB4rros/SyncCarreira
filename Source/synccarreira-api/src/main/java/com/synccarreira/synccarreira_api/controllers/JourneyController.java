package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.CustomError;
import com.synccarreira.synccarreira_api.dto.JourneyDoubtDTO;
import com.synccarreira.synccarreira_api.services.JourneyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/journey")
@Tag(name = "Jornada", description = "Endpoints sobre a jornada completa do aluno pelas trilhas.")
public class JourneyController {

    private final JourneyService journeyService;

    public JourneyController(final JourneyService journeyService) {
        this.journeyService = journeyService;
    }

    @GetMapping("/doubt")
    @Operation(summary = "Informa se o aluno logado já sinalizou que está em dúvida sobre a escolha profissional, e quando.")
    @ApiResponse(
            responseCode = "200",
            description = "Sinalização de dúvida encontrada com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = JourneyDoubtDTO.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Aluno não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<JourneyDoubtDTO> findDoubt() {
        return ResponseEntity.ok(journeyService.findDoubt());
    }

    @PostMapping("/doubt")
    @Operation(summary = "Sinaliza que o aluno logado concluiu a jornada e ainda está em dúvida sobre a escolha profissional. As psicólogas da instituição do aluno são avisadas por e-mail.")
    @ApiResponse(
            responseCode = "200",
            description = "Dúvida sinalizada com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = JourneyDoubtDTO.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Aluno não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "409",
            description = "A dúvida já foi sinalizada pelo aluno.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "422",
            description = "O aluno ainda não concluiu a jornada.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<JourneyDoubtDTO> flagDoubt() {
        return ResponseEntity.ok(journeyService.flagDoubt());
    }
}
