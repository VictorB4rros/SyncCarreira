package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SynthesisInsertDTO(
        @NotNull(message = "A trilha associada é obrigatória")
        Long trailId,

        @NotBlank(message = "Campo obrigatório")
        @Size(max = SynthesisInsertDTO.MAX_CONTENT_LENGTH, message = "A síntese deve ter no máximo " + SynthesisInsertDTO.MAX_CONTENT_LENGTH + " caracteres")
        String content
) {

    public static final int MAX_CONTENT_LENGTH = 5000;
}
