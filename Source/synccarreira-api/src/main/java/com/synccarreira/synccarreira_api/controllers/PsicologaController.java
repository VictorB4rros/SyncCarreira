package com.synccarreira.synccarreira_api.controllers;

import com.synccarreira.synccarreira_api.dto.PsychologistDTO;
import com.synccarreira.synccarreira_api.services.PsicologaService;
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
    public ResponseEntity<List<PsychologistDTO>> findAll() {
        return ResponseEntity.ok(psicologaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PsychologistDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(psicologaService.findById(id));
    }

    @PostMapping
    public ResponseEntity<PsychologistDTO> create(@RequestBody PsychologistDTO dto) {
        PsychologistDTO psicologa = psicologaService.create(dto);
        URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(psicologa.id())
                .toUri();
        return ResponseEntity.created(uri).body(psicologa);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PsychologistDTO> update(@PathVariable Long id, @RequestBody PsychologistDTO dto) {
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
        PsychologistDTO psicologa = psicologaService.findById(id);
        return ResponseEntity.ok(psicologa.isContractValid());
    }
}
