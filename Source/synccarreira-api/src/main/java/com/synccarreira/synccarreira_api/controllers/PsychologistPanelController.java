package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.psychologist.PanelDTOs;
import com.synccarreira.synccarreira_api.services.PsychologistPanelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/psychologist-panel")
@Tag(name = "Painel da psicóloga", description = "Status por aluno sem respostas individuais, alertas automáticos e priorização.")
public class PsychologistPanelController {

    private final PsychologistPanelService panelService;

    public PsychologistPanelController(PsychologistPanelService panelService) {
        this.panelService = panelService;
    }

    @GetMapping
    @Operation(summary = "Painel de status por aluno + alertas abertos. Filtro opcional só 'em dúvida'.")
    public ResponseEntity<PanelDTOs.PanelSummary> panel(
            @PathVariable Long psychologistId,
            @RequestParam(required = false, name = "onlyInDoubt") Boolean onlyInDoubt) {
        return ResponseEntity.ok(panelService.panel(psychologistId, onlyInDoubt));
    }

}
