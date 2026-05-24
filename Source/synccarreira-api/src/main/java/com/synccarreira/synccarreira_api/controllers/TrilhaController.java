package com.synccarreira.synccarreira_api.controller;

import com.synccarreira.synccarreira_api.dto.TrilhaDTO;
import com.synccarreira.synccarreira_api.service.TrilhaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/trilhas")
public class TrilhaController {

    @Autowired
    private TrilhaService trilhaService;

    @GetMapping
    public ResponseEntity<List<TrilhaDTO>> findAll() {
        return ResponseEntity.ok(trilhaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrilhaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(trilhaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<TrilhaDTO> create(@RequestBody TrilhaDTO dto) {
        TrilhaDTO trilha = trilhaService.create(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(trilha.id())
                .toUri();
        return ResponseEntity.created(uri).body(trilha);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrilhaDTO> update(@PathVariable Long id, @RequestBody TrilhaDTO dto) {
        return ResponseEntity.ok(trilhaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        trilhaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Verifica se o aluno pode acessar a trilha informada.
     * Recebe no body a lista de IDs de perguntas já respondidas pelo aluno.
     *
     * Exemplo de request:
     * POST /trilhas/{id}/pode-acessar
     * Body: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     */
    @PostMapping("/{id}/pode-acessar")
    public ResponseEntity<Boolean> podeAcessar(
            @PathVariable Long id,
            @RequestBody List<Long> idsRespondidos) {
        boolean acesso = trilhaService.podeAcessar(id, idsRespondidos);
        return ResponseEntity.ok(acesso);
    }
}
