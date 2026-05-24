package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.Trilha;
import com.synccarreira.synccarreira_api.entities.enums.NomeTrilha;

public record TrilhaDTO(
        Long id,
        NomeTrilha nome,
        Integer ordemSequencial
) {
    // Converte Entity → DTO
    public TrilhaDTO(Trilha trilha) {
        this(
                trilha.getId(),
                trilha.getNome(),
                trilha.getOrdemSequencial()
        );
    }
}
