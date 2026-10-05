package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Answer;
import com.synccarreira.synccarreira_api.projections.AnsweredQuestionsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query("SELECT a FROM Answer a " +
            "JOIN FETCH a.questionOption qo " +
            "JOIN FETCH qo.question q " +
            "WHERE a.student.id = :studentId " +
            "AND q.trail.id = :trailId")
    List<Answer> findByStudentAndTrail(Long studentId, Long trailId);

    // AnswerRepository.java
    @Query("SELECT a FROM Answer a JOIN FETCH a.questionOption WHERE a.student.id = :studentId")
    List<Answer> findByStudentId(Long studentId);

    @Query("SELECT new com.synccarreira.synccarreira_api.projections.AnsweredQuestionsProjection(s.id, q.trail.id, COUNT(DISTINCT q.id)) " +
            "FROM Answer a " +
            "JOIN a.student s " +
            "JOIN s.determinedSchoolClass c " +
            "JOIN a.questionOption qo " +
            "JOIN qo.question q " +
            "WHERE c.institution.id = :institutionId " +
            "GROUP BY s.id, q.trail.id")
    List<AnsweredQuestionsProjection> countAnsweredQuestionsByInstitution(@Param("institutionId") Long institutionId);
}
