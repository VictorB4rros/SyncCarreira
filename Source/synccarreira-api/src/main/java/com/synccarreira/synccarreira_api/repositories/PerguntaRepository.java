package com.synccarreira.synccarreira_api.repository;

import com.synccarreira.synccarreira_api.entities.Pergunta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerguntaRepository extends JpaRepository<Pergunta, Long> {

    // Busca todas as perguntas de uma trilha — usado pelo aluno ao acessar a trilha
    List<Pergunta> findByTrilhaId(Long trilhaId);

    // Busca todas as perguntas cadastradas por uma psicóloga específica
    List<Pergunta> findByPsicologaId(Long psicologaId);

    // Conta quantas perguntas uma trilha possui — útil para validar o limite de 10
    long countByTrilhaId(Long trilhaId);
}
