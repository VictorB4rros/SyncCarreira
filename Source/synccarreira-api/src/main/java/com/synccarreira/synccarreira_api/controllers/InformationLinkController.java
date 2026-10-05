package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.CustomError;
import com.synccarreira.synccarreira_api.dto.InformationTrailDTO;
import com.synccarreira.synccarreira_api.services.InformationLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/information-links")
@Tag(name = "Trilha de informação", description = "Endpoints para os links de carreiras e de acesso à universidade exibidos na trilha de informação.")
public class InformationLinkController {

    private final InformationLinkService informationLinkService;

    public InformationLinkController(final InformationLinkService informationLinkService) {
        this.informationLinkService = informationLinkService;
    }

    @GetMapping("/me")
    @Operation(summary = "Busca os links da trilha de informação para o aluno logado: links das carreiras da área em que ele tem maior score e links de acesso à universidade.")
    @ApiResponse(
            responseCode = "200",
            description = "Links encontrados com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = InformationTrailDTO.class)) }
    )
    @ApiResponse(
            responseCode = "403",
            description = "O aluno ainda não concluiu as trilhas anteriores.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Aluno ou trilha de informação não encontrados.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<InformationTrailDTO> findForLoggedStudent() {
        return ResponseEntity.ok(informationLinkService.findForLoggedStudent());
    }
}
