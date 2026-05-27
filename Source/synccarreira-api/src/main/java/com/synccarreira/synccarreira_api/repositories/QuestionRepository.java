package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Busca todas as perguntas de uma trilha — usado pelo aluno ao acessar a trilha
    List<Question> findByTrailId(Long trailId);

    // Busca todas as perguntas cadastradas por uma psicóloga específica
    List<Question> findByPsychologistId(Long psychologist);

    // Conta quantas perguntas uma trilha possui — útil para validar o limite de 10
    long countByTrailId(Long trailId);
}
