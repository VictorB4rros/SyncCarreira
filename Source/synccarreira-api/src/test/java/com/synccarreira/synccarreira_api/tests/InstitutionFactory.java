package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.InstitutionDTO;
import com.synccarreira.synccarreira_api.entities.Institution;
import com.synccarreira.synccarreira_api.entities.SchoolClass;
import com.synccarreira.synccarreira_api.entities.enums.InstitutionType;

import java.time.Instant;

public class InstitutionFactory {

    public static Institution createInstitution() {
        Institution institution = new Institution(1L, "Escola Estadual Pedro II", "E.E. Pedro II", "33158816000105", InstitutionType.PUBLICA, Boolean.TRUE, Instant.now());
        SchoolClass schoolClass = SchoolClassFactory.createSchoolClass();
        institution.getSchoolClassList().add(schoolClass);
        return institution;
    }

    public static InstitutionDTO createInstitutionDTO() {
        return new InstitutionDTO(createInstitution());
    }
}
