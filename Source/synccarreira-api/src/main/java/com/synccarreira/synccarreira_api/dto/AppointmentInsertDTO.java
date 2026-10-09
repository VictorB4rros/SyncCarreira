package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.enums.ScheduleType;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public record AppointmentInsertDTO(
        @NotBlank(message = "Campo obrigatório")
        String title,

        String description,

        @NotNull(message = "Campo obrigatório")
        @Future(message = "A data da sessão deve estar no futuro")
        LocalDateTime dateTime,

        @NotNull(message = "Campo obrigatório")
        @Positive(message = "Duração inválida")
        Integer durationMinutes,

        @NotNull(message = "Campo obrigatório")
        ScheduleType scheduleType,

        @NotNull(message = "Campo obrigatório")
        Long psychologistId,

        @NotEmpty(message = "Informe ao menos um aluno")
        List<@NotNull Long> studentIds,

        String googleEventId,

        String meetLink,

        String calendarLink
) {
}
