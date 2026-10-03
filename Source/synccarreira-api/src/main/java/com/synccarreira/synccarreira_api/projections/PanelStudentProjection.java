package com.synccarreira.synccarreira_api.projections;

public record PanelStudentProjection(
        Long studentId,
        String studentName,
        Long schoolClassId,
        String schoolClassName
) {
}
