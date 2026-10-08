package com.synccarreira.synccarreira_api.dto;

import java.time.Instant;

public record JourneyDoubtDTO(
        Long studentId,
        boolean inDoubt,
        Instant doubtFlaggedAt
) {
}
