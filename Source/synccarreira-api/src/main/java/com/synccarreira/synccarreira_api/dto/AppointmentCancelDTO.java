package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.NotBlank;

public record AppointmentCancelDTO(
        @NotBlank(message = "Campo obrigatório")
        String cancelReason
) {
}
