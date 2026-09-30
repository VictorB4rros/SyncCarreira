package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.projections.TrailQuestionCountProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByTrailId(Long trailId);

    List<Question> findByPsychologistId(Long psychologist);

    long countByTrailId(Long trailId);

    @Query(value = "SELECT q.id FROM Question q WHERE q.id IN :answerIds")
    List<Long> findByAnswers(@Param("answerIds") List<Long> answerIds);

    @Query("SELECT new com.synccarreira.synccarreira_api.projections.TrailQuestionCountProjection(q.trail.id, COUNT(q)) " +
            "FROM Question q " +
            "GROUP BY q.trail.id")
    List<TrailQuestionCountProjection> countQuestionsByTrail();
}
