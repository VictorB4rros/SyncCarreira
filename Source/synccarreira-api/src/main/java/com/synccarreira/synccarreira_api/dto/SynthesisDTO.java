package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.Synthesis;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;

import java.time.Instant;

public record SynthesisDTO(
        Long id,
        String content,
        Long trailId,
        TrailName trailName,
        Integer trailSequentialOrder,
        // true quando é a síntese final da jornada (enviada ao fim da trilha de informação)
        boolean journeySynthesis,
        Instant createdAt
) {

    public SynthesisDTO(Synthesis entity) {
        this(
                entity.getId(),
                entity.getContent(),
                entity.getTrail().getId(),
                entity.getTrail().getName(),
                entity.getTrail().getSequentialOrder(),
                entity.getTrail().getName() == TrailName.INFORMACAO,
                entity.getCreatedAt()
        );
    }
}
