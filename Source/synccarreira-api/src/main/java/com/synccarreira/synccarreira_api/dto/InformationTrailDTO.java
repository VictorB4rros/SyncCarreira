package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;

import java.util.List;

public record InformationTrailDTO(
        List<KnowledgeArea> recommendedAreas,
        StudentScoreDTO score,
        List<InformationLinkDTO> careerLinks,
        List<InformationLinkDTO> universityAccessLinks
) {
}
