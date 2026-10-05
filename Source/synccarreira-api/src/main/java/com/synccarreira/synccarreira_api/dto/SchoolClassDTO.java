package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.SchoolClass;

import java.time.Instant;

public record SchoolClassDTO(
        Long id,
        String name,
        Integer schoolYear,
        Long institutionId,
        String institutionName,
        Instant createdAt
) {
    public SchoolClassDTO(SchoolClass e) {
        this(
                e.getId(),
                e.getName(),
                e.getSchoolYear(),
                e.getInstitution() != null ? e.getInstitution().getId() : null,
                e.getInstitution() != null ? e.getInstitution().getLegalName() : null,
                e.getCreatedAt()
        );
    }
}
