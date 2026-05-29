package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.QuestionDTO;
import com.synccarreira.synccarreira_api.services.PerguntaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/perguntas")
public class PerguntaController {

    @Autowired
    private PerguntaService perguntaService;

    @GetMapping
    public ResponseEntity<List<QuestionDTO>> findAll() {
        return ResponseEntity.ok(perguntaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(perguntaService.findById(id));
    }

    /**
     * Lista todas as perguntas de uma trilha específica.
     * Usado pelo aluno ao acessar a trilha.
     * GET /perguntas/trilha/{trilhaId}
     */
    @GetMapping("/trilha/{trilhaId}")
    public ResponseEntity<List<QuestionDTO>> findByTrilha(@PathVariable Long trilhaId) {
        return ResponseEntity.ok(perguntaService.findByTrilha(trilhaId));
    }

    /**
     * Lista todas as perguntas cadastradas por uma psicóloga.
     * GET /perguntas/psicologa/{psicologaId}
     */
    @GetMapping("/psicologa/{psicologaId}")
    public ResponseEntity<List<QuestionDTO>> findByPsicologa(@PathVariable Long psicologaId) {
        return ResponseEntity.ok(perguntaService.findByPsicologa(psicologaId));
    }

    /**
     * Cadastra uma nova pergunta.
     * O body deve incluir o psicologaId — o serviço valida o contrato automaticamente.
     * POST /perguntas
     */
    @PostMapping
    public ResponseEntity<QuestionDTO> create(@RequestBody QuestionDTO dto) {
        QuestionDTO pergunta = perguntaService.create(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(pergunta.id())
                .toUri();
        return ResponseEntity.created(uri).body(pergunta);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionDTO> update(@PathVariable Long id, @RequestBody QuestionDTO dto) {
        return ResponseEntity.ok(perguntaService.update(id, dto));
    }

    /**
     * Exclui uma pergunta.
     * Requer psicologaId como query param para validar contrato antes de excluir.
     * DELETE /perguntas/{id}?psicologaId=1
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam Long psicologaId) {
        perguntaService.delete(id, psicologaId);
        return ResponseEntity.noContent().build();
    }
}
