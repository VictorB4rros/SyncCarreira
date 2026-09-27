package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.PsychologistInsertDTO;
import com.synccarreira.synccarreira_api.dto.PsychologistUpdateDTO;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Role;

import java.time.LocalDate;

public class PsychologistFactory {

    public static final String PSYCHOLOGIST_ROLE = "ROLE_PSICOLOGA";

    public static Role createPsychologistRole() {
        return new Role(3L, PSYCHOLOGIST_ROLE);
    }

    public static Psychologist createPsychologist() {
        Psychologist psychologist = new Psychologist();
        psychologist.setId(1L);
        psychologist.setName("Lorena Souza");
        psychologist.setEmail("lorena.psi@gmail.com");
        psychologist.setPassword("hash-antigo");
        psychologist.setCrp("06/00029");
        psychologist.setContractExpirationDate(LocalDate.now().plusYears(1));
        // role antiga (ex.: ROLE_ADMIN) — o update deve trocar por ROLE_PSICOLOGA
        psychologist.addRole(new Role(2L, "ROLE_ADMIN"));
        return psychologist;
    }

    /** roleId 2 de propósito: o service deve IGNORAR o roleId e usar ROLE_PSICOLOGA. */
    public static PsychologistInsertDTO createPsychologistInsertDTO() {
        return new PsychologistInsertDTO(
                "Lorena Souza",
                "lorena.psi@gmail.com",
                2L,
                "06/00029",
                LocalDate.now().plusYears(1),
                "senha12345"
        );
    }

    public static PsychologistUpdateDTO createPsychologistUpdateDTO() {
        return new PsychologistUpdateDTO(
                "Lorena Souza Lima",
                "lorena.lima@gmail.com",
                2L,
                "06/00030",
                LocalDate.now().plusYears(2)
        );
    }
}