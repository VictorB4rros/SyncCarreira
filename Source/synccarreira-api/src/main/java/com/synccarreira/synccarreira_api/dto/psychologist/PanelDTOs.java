package com.synccarreira.synccarreira_api.dto.psychologist;

import java.time.Instant;
import java.util.List;

public final class PanelDTOs {

    private PanelDTOs() {
    }

    public record StudentStatus(
            Long studentId,
            String studentName,
            String institutionName,
            String className,
            Integer cycle,
            String journeyStatus,
            long concludedTrails,
            long totalTrails,
            Boolean inDoubt,
            boolean needsGuidance
    ) {
    }

    public record AlertView(
            Long alertId,
            Long studentId,
            String studentName,
            String className,
            String reason,
            String priority,
            Long journeyId,
            boolean resolved,
            Instant createdAt
    ) {
    }

    public record PanelSummary(
            int totalStudents,
            int completedJourneys,
            int inDoubtStudents,
            int openAlerts,
            List<StudentStatus> students,
            List<AlertView> alerts
    ) {
    }
}
