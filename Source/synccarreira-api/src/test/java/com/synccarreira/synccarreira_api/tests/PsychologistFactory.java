package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.PsychologistInsertDTO;
import com.synccarreira.synccarreira_api.entities.Institution;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Role;

import java.time.LocalDate;

public class PsychologistFactory {

    public static final String PSYCHOLOGIST_ROLE = "ROLE_PSICOLOGA";

    public static Role createPsychologistRole() {
        return new Role(3L, PSYCHOLOGIST_ROLE);
    }

    public static Psychologist createPsychologist() {
        Institution institution = InstitutionFactory.createInstitution();
        Psychologist psychologist = new Psychologist();
        psychologist.setId(1L);
        psychologist.setName("Lorena Souza");
        psychologist.setEmail("lorena.psi@gmail.com");
        psychologist.setPassword("hash-antigo");
        psychologist.setCrp("06/00029");
        psychologist.setInstitution(institution);
        psychologist.setContractExpirationDate(LocalDate.now().plusYears(1));
        psychologist.addRole(new Role(3L, "ROLE_PSICOLOGA"));
        return psychologist;
    }

    public static Psychologist createExpiredContractPsychologist() {
        Psychologist psychologist = createPsychologist();
        psychologist.setContractExpirationDate(LocalDate.now().minusDays(1));
        return psychologist;
    }

    public static PsychologistInsertDTO createPsychologistInsertDTO() {
        return new PsychologistInsertDTO(
                "Lorena Souza",
                "lorena.psi@gmail.com",
                "06/00029",
                1L,
                LocalDate.now().plusYears(1)
        );
    }
}