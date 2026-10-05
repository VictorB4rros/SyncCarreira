package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import com.synccarreira.synccarreira_api.tests.StudentFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

public class StudentTests {

    @Test
    void highestScoreAreasShouldReturnAreaWithHighestScore() {
        Student student = StudentFactory.createStudent();

        Assertions.assertEquals(List.of(KnowledgeArea.BIOLOGICAS), student.highestScoreAreas());
    }

    @Test
    void highestScoreAreasShouldReturnAllTiedAreasWhenThereIsATie() {
        Student student = StudentFactory.createStudent();
        student.setHumanitiesScore(40.0);
        student.setArtsScore(40.0);

        Assertions.assertEquals(List.of(KnowledgeArea.HUMANAS, KnowledgeArea.ARTES), student.highestScoreAreas());
    }

    @Test
    void highestScoreAreasShouldTreatNullScoreAsZero() {
        Student student = StudentFactory.createStudent();
        student.setHumanitiesScore(null);
        student.setBiologicalSciencesScore(null);
        student.setExactSciencesScore(null);

        Assertions.assertEquals(List.of(KnowledgeArea.ARTES), student.highestScoreAreas());
    }
}
