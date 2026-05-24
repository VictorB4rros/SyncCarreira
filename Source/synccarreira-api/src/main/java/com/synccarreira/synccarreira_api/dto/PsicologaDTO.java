package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.Psicologa;

import java.time.LocalDate;

public record PsicologaDTO(
        Long id,
        String nomePsicologa,
        String email,
        String crp,
        LocalDate dataVencContrato,
        boolean contratoValido
) {
    // Converte Entity → DTO
    public PsicologaDTO(Psicologa psicologa) {
        this(
                psicologa.getId(),
                psicologa.getNomePsicologa(),
                psicologa.getEmail(),
                psicologa.getCrp(),
                psicologa.getDataVencContrato(),
                psicologa.isContratoValido()
        );
    }
}
