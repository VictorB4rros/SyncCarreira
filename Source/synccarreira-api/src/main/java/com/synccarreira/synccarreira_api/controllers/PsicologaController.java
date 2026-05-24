package com.synccarreira.synccarreira_api.controller;

import com.synccarreira.synccarreira_api.dto.PsicologaDTO;
import com.synccarreira.synccarreira_api.service.PsicologaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/psicologas")
public class PsicologaController {

    @Autowired
    private PsicologaService psicologaService;

    @GetMapping
    public ResponseEntity<List<PsicologaDTO>> findAll() {
        return ResponseEntity.ok(psicologaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PsicologaDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(psicologaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PsicologaDTO> create(@RequestBody PsicologaDTO dto) {
        PsicologaDTO psicologa = psicologaService.create(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(psicologa.id())
                .toUri();
        return ResponseEntity.created(uri).body(psicologa);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PsicologaDTO> update(@PathVariable Long id, @RequestBody PsicologaDTO dto) {
        return ResponseEntity.ok(psicologaService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        psicologaService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint utilitário para verificar se o contrato da psicóloga está ativo.
     * Útil para o frontend exibir alertas ou bloquear ações na UI.
     *
     * GET /psicologas/{id}/contrato-valido
     * Retorna: true ou false
     */
    @GetMapping("/{id}/contrato-valido")
    public ResponseEntity<Boolean> isContratoValido(@PathVariable Long id) {
        PsicologaDTO psicologa = psicologaService.findById(id);
        return ResponseEntity.ok(psicologa.contratoValido());
    }
}
