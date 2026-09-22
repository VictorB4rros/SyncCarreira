package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.entities.SchoolClass;

import java.time.Instant;

public class SchoolClassFactory {

    public static SchoolClass createSchoolClass() {
        return new SchoolClass(1L, "3º ano A", 2026, Instant.now());
    }
}
