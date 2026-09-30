package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.InformationLink;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;

public record InformationLinkDTO(
        Long id,
        String topic,
        String url,
        KnowledgeArea knowledgeArea
) {

    public InformationLinkDTO(InformationLink entity) {
        this(
                entity.getId(),
                entity.getTopic(),
                entity.getUrl(),
                entity.getKnowledgeArea()
        );
    }
}
