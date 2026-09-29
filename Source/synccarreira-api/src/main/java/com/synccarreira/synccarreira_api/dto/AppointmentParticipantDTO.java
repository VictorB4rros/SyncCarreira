package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.User;

public record AppointmentParticipantDTO(
        Long id,
        String name,
        String email
) {
    public AppointmentParticipantDTO(User user) {
        this(user.getId(), user.getName(), user.getEmail());
    }
}
