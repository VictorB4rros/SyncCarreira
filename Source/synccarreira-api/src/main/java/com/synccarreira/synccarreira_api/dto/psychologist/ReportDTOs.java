package com.synccarreira.synccarreira_api.dto.psychologist;

import com.synccarreira.synccarreira_api.dto.SynthesisDTO;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;

import java.util.List;
import java.util.Map;

public final class ReportDTOs {

    private ReportDTOs() {
    }

    // Panorama da jornada de um aluno: dados cadastrais, afinidade por área, progresso nas trilhas e sínteses enviadas.
    // A afinidade é o percentual (0 a 100) da pontuação sobre o máximo possível da área, o mesmo cálculo do resultado
    // da jornada (ver AreaScoreCalculator). A pontuação bruta não entra no relatório.
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
            Map<KnowledgeArea, Double> affinities,
            List<KnowledgeArea> highestScoreAreas,
            PanelDTOs.StudentStatus status,
            List<SynthesisDTO> syntheses
    ) {
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
