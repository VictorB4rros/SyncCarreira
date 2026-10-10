package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.SynthesisDTO;
import com.synccarreira.synccarreira_api.dto.SynthesisInsertDTO;
import com.synccarreira.synccarreira_api.entities.Synthesis;
import com.synccarreira.synccarreira_api.entities.Trail;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;

import java.time.Instant;
import java.util.ArrayList;

public class SynthesisFactory {

    public static final String CONTENT = "Percebi que gosto mais de áreas criativas do que imaginava.";

    public static Trail createInformationTrail() {
        return new Trail(4L, TrailName.INFORMACAO, 4, new ArrayList<>());
    }

    public static Synthesis createSynthesis(Trail trail) {
        return new Synthesis(1L, CONTENT, StudentFactory.createStudent(), trail, Instant.parse("2026-10-05T12:00:00Z"));
    }

    public static SynthesisInsertDTO createSynthesisInsertDTO(Long trailId) {
        return new SynthesisInsertDTO(trailId, CONTENT);
    }

    public static SynthesisDTO createSynthesisDTO() {
        return new SynthesisDTO(createSynthesis(TrailFactory.createTrail()));
    }
}
