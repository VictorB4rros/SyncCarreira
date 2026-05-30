package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    @Query(value = "SELECT a FROM Answer a WHERE a.student.id = :studentId AND a.questionOption.question.trail.id = :trailId")
    List<Answer> findByStudentAndTrail(Long studentId, Long trailId);
}
