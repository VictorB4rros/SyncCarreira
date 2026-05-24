package com.synccarreira.synccarreira_api.repository;

import com.synccarreira.synccarreira_api.entities.Psicologa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PsicologaRepository extends JpaRepository<Psicologa, Long> {

    // Verifica existência de CRP + nome para garantir unicidade na camada de serviço
    boolean existsByNomePsicologaAndCrp(String nomePsicologa, String crp);

    // Busca por CRP — útil para autenticação ou consultas específicas
    Optional<Psicologa> findByCrp(String crp);
}
