package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.CustomError;
import com.synccarreira.synccarreira_api.dto.SynthesisDTO;
import com.synccarreira.synccarreira_api.dto.SynthesisInsertDTO;
import com.synccarreira.synccarreira_api.dto.ValidationError;
import com.synccarreira.synccarreira_api.services.SynthesisService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/syntheses")
@Tag(name = "Sínteses", description = "Endpoints para as sínteses textuais que o aluno escreve ao concluir cada trilha e ao final da jornada.")
public class SynthesisController {

    private final SynthesisService synthesisService;

    public SynthesisController(final SynthesisService synthesisService) {
        this.synthesisService = synthesisService;
    }

    @GetMapping("/me")
    @Operation(summary = "Busca as sínteses já enviadas pelo aluno logado, na ordem das trilhas.")
    @ApiResponse(
            responseCode = "200",
            description = "Sínteses encontradas com sucesso."
    )
    @ApiResponse(
            responseCode = "404",
            description = "Aluno não encontrado.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    public ResponseEntity<List<SynthesisDTO>> findForLoggedStudent() {
        return ResponseEntity.ok(synthesisService.findForLoggedStudent());
    }

    @PostMapping
    @Operation(summary = "Envia a síntese do aluno logado sobre uma trilha. Na trilha de informação, é a síntese final sobre a jornada completa.")
    @ApiResponse(
            responseCode = "201",
            description = "Síntese enviada com sucesso.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = SynthesisDTO.class)) }
    )
    @ApiResponse(
            responseCode = "403",
            description = "A trilha ainda não foi liberada para o aluno.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "404",
            description = "Aluno ou trilha não encontrados.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "409",
            description = "A síntese desta trilha já foi enviada.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = CustomError.class)) }
    )
    @ApiResponse(
            responseCode = "422",
            description = "Dados inválidos ou perguntas da trilha ainda não respondidas.",
            content = { @Content(mediaType = "application/json", schema = @Schema(implementation = ValidationError.class)) }
    )
    public ResponseEntity<SynthesisDTO> insert(@Valid @RequestBody SynthesisInsertDTO dto) {
        SynthesisDTO result = synthesisService.insert(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(result.id()).toUri();
        return ResponseEntity.created(uri).body(result);
    }
}
