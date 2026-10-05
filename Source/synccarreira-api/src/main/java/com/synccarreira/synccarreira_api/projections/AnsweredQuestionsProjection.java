package com.synccarreira.synccarreira_api.projections;

public record AnsweredQuestionsProjection(
        Long studentId,
        Long trailId,
        Long answeredQuestions
) {
}
