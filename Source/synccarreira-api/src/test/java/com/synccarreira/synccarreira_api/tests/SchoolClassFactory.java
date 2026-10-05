package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.SchoolClassDTO;
import com.synccarreira.synccarreira_api.dto.SchoolClassInsertDTO;
import com.synccarreira.synccarreira_api.dto.SchoolClassUpdateDTO;
import com.synccarreira.synccarreira_api.entities.SchoolClass;

import java.time.Instant;

public class SchoolClassFactory {

    public static SchoolClass createSchoolClass() {
        return new SchoolClass(1L, "3º ano A", 2026, Instant.now());
    }

    public static SchoolClassDTO createSchoolClassDTO() {
        return new SchoolClassDTO(createSchoolClass());
    }

    public static SchoolClassInsertDTO createValidSchoolClassInsertDTO() {
        return new SchoolClassInsertDTO("3º ano A", 2026, 1L);
    }

    public static SchoolClassInsertDTO createInvalidSchoolClassInsertDTO() {
        return new SchoolClassInsertDTO("3º ano A", 2026, 100L);
    }

    public static SchoolClassUpdateDTO createSchoolClassUpdateDTO() {
        return new SchoolClassUpdateDTO("3º ano A", 2026);
    }
}
