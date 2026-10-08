package com.synccarreira.synccarreira_api.dto.psychologist;

import com.synccarreira.synccarreira_api.entities.enums.ProgressStatus;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;

import java.time.Instant;
import java.util.List;

public final class PanelDTOs {

    private PanelDTOs() {
    }

    public record TrailProgress(
            Long trailId,
            TrailName trailName,
            Integer sequentialOrder,
            long answeredQuestions,
            long totalQuestions,
            int progressPercentage,
            boolean synthesisSubmitted,
            ProgressStatus status
    ) {
    }

    public record StudentStatus(
            Long studentId,
            String studentName,
            Long schoolClassId,
            String schoolClassName,
            long answeredQuestions,
            long totalQuestions,
            int progressPercentage,
            int concludedTrails,
            int totalTrails,
            TrailName currentTrail,
            boolean finalSynthesisSubmitted,
            ProgressStatus journeyStatus,
            // true quando o aluno concluiu a jornada e sinalizou que ainda está em dúvida sobre a escolha profissional
            boolean inDoubt,
            Instant doubtFlaggedAt,
            List<TrailProgress> trails
    ) {
    }

    public record PanelSummary(
            int totalStudents,
            int notStartedStudents,
            int inProgressStudents,
            int concludedStudents,
            int inDoubtStudents,
            List<StudentStatus> students
    ) {
    }
}
