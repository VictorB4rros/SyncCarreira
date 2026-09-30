package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.CustomError;
import com.synccarreira.synccarreira_api.dto.psychologist.PanelDTOs;
import com.synccarreira.synccarreira_api.services.PsychologistPanelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/psychologist-panel")
@Tag(name = "Painel da psicóloga", description = "Endpoints do painel de acompanhamento da psicóloga sobre o progresso dos alunos nas trilhas.")
public class PsychologistPanelController {

    private final PsychologistPanelService panelService;

    public PsychologistPanelController(final PsychologistPanelService panelService) {
        this.panelService = panelService;
    }

    @GetMapping("/{psychologistId}")
    @Operation(summary = "Busca o painel de status por aluno: o progresso de cada aluno da instituição da psicóloga em cada trilha da jornada.")
    @ApiResponse(
            responseCode = "200",
            description = "Painel encontrado com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = PanelDTOs.PanelSummary.class)) }
    )
    @ApiResponse(
            responseCode = "403",
            description = "Acesso ao painel de outra psicóloga.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Psicóloga não encontrada.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "422",
            description = "Psicóloga não vinculada a uma instituição.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<PanelDTOs.PanelSummary> findPanel(
            @Parameter(description = "Id da psicóloga dona do painel.", required = true)
            @PathVariable Long psychologistId
    ) {
        return ResponseEntity.ok(panelService.findPanel(psychologistId));
    }
}
