package com.synccarreira.synccarreira_api.repository;

import com.synccarreira.synccarreira_api.entities.Trilha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TrilhaRepository extends JpaRepository<Trilha, Long> {

    // Busca a trilha anterior (ordem - 1) para verificar se está concluída
    @Query("SELECT t FROM Trilha t WHERE t.ordemSequencial = :ordem")
    Optional<Trilha> findByOrdemSequencial(@Param("ordem") Integer ordem);
}
