package com.synccarreira.synccarreira_api.dto.psychologist;

import com.synccarreira.synccarreira_api.dto.SynthesisDTO;
import com.synccarreira.synccarreira_api.dto.result.AreaScoreDTO;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;

import java.util.List;

public final class ReportDTOs {

    private ReportDTOs() {
    }

    // Panorama da jornada de um aluno: dados cadastrais, pontuação e afinidade por área, progresso nas trilhas e sínteses enviadas.
    // As áreas de maior afinidade seguem o mesmo cálculo do resultado da jornada (percentual do máximo possível, ver AreaScoreCalculator).
    public record StudentReport(
            Long studentId,
            String name,
            String email,
            String scholarYear,
            String schoolType,
            String race,
            String schoolClassName,
            Integer schoolYear,
            String institutionName,
            List<AreaScoreDTO> areaScores,
            List<KnowledgeArea> highestScoreAreas,
            PanelDTOs.StudentStatus status,
            List<SynthesisDTO> syntheses
    ) {

        public AreaScoreDTO areaScore(KnowledgeArea area) {
            return areaScores.stream()
                    .filter(score -> score.area() == area)
                    .findFirst()
                    .orElse(null);
        }
    }

    public record ClassReport(
            Long schoolClassId,
            String schoolClassName,
            Integer schoolYear,
            String institutionName,
            int totalStudents,
            int notStartedStudents,
            int inProgressStudents,
            int concludedStudents,
            int inDoubtStudents,
            List<StudentReport> students
    ) {
    }
}
