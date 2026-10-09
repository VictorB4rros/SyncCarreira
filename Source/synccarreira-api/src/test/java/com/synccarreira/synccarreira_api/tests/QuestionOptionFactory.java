package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.QuestionOptionDTO;
import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.entities.QuestionOption;

public class QuestionOptionFactory {

    public static QuestionOption createQuestionOption(Question question) {
        return new QuestionOption(1L, "Matemática", 0.0, 0.0, 1.0, 0.0, question);
    }

    public static QuestionOptionDTO createQuestionOptionDTO() {
        return new QuestionOptionDTO(null, "Matemática", 0.0, 0.0, 1.0, 0.0);
    }
}
