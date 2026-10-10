package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.CustomError;
import com.synccarreira.synccarreira_api.dto.InformationLinkDTO;
import com.synccarreira.synccarreira_api.dto.InformationLinkInsertDTO;
import com.synccarreira.synccarreira_api.dto.InformationTrailDTO;
import com.synccarreira.synccarreira_api.dto.ValidationError;
import com.synccarreira.synccarreira_api.services.InformationLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
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

    @GetMapping
    @Operation(summary = "Lista todos os links da trilha de informação, para gestão pela psicóloga. Links sem área de conhecimento são os de acesso à universidade.")
    @ApiResponse(
            responseCode = "200",
            description = "Links encontrados com sucesso.",
            content = { @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = InformationLinkDTO.class))) }
    )
    public ResponseEntity<List<InformationLinkDTO>> findAll() {
        return ResponseEntity.ok(informationLinkService.findAll());
    }

    @PostMapping
    @Operation(summary = "Cadastra um link na trilha de informação. Sem área de conhecimento, o link é exibido na seção de acesso à universidade.")
    @ApiResponse(
            responseCode = "201",
            description = "Link cadastrado com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = InformationLinkDTO.class)) }
    )
    @ApiResponse(
            responseCode = "422",
            description = "Dados inválidos.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = ValidationError.class)) }
    )
    public ResponseEntity<InformationLinkDTO> create(@Valid @RequestBody InformationLinkInsertDTO dto) {
        InformationLinkDTO created = informationLinkService.create(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(uri).body(created);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Exclui um link da trilha de informação.")
    @ApiResponse(responseCode = "204", description = "Link excluído com sucesso.")
    @ApiResponse(
            responseCode = "404",
            description = "Link não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        informationLinkService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
