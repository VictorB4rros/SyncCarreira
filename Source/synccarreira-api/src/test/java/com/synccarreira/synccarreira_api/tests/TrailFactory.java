package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.entities.Trail;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;

import java.util.ArrayList;

public class TrailFactory {

    public static Trail createTrail() {
        return new Trail(1L, TrailName.AUTOCONHECIMENTO, 1, new ArrayList<>());
    }
}
