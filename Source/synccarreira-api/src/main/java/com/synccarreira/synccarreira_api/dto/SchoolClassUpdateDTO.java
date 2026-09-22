package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SchoolClassUpdateDTO(
        @NotBlank(message = "Campo obrigatório")
        String name,

        @NotNull(message = "Campo obrigatório")
        @Positive(message = "Ano letivo inválido")
        Integer schoolYear
) {
}
