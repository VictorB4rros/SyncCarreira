package com.synccarreira.synccarreira_api.dto.psychologist;

import com.synccarreira.synccarreira_api.entities.enums.ProgressStatus;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;

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
            ProgressStatus journeyStatus,
            List<TrailProgress> trails
    ) {
    }

    public record PanelSummary(
            int totalStudents,
            int notStartedStudents,
            int inProgressStudents,
            int concludedStudents,
            List<StudentStatus> students
    ) {
    }
}
