package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByTrailId(Long trailId);

    List<Question> findByPsychologistId(Long psychologist);

    long countByTrailId(Long trailId);
}
