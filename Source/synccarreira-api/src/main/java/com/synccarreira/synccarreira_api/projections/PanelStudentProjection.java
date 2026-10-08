package com.synccarreira.synccarreira_api.projections;

import java.time.Instant;

public record PanelStudentProjection(
        Long studentId,
        String studentName,
        Long schoolClassId,
        String schoolClassName,
        Boolean inDoubt,
        Instant doubtFlaggedAt
) {
}
