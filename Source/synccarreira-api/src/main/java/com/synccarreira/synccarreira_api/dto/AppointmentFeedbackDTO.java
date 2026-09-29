package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.NotBlank;

public record AppointmentFeedbackDTO(
        @NotBlank(message = "Campo obrigatório")
        String feedback
) {
}
