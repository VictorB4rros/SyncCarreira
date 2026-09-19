package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Institution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InstitutionRepository extends JpaRepository<Institution, Long> {

    boolean existsByCnpj(String cnpj);

    Optional<Institution> findByCnpj(String cnpj);
}
