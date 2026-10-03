package com.synccarreira.synccarreira_api.projections;

public record TrailQuestionCountProjection(
        Long trailId,
        Long totalQuestions
) {
}
