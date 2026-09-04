package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_aluno")
@NoArgsConstructor
@AllArgsConstructor
public class Student extends User {

    @Column(name = "ano_escolaridade")
    @Getter
    @Setter
    private String schollarYear;

    @Column(name = "tipo_escola")
    @Getter
    @Setter
    private String schoolType;

    @Column(name = "raca")
    @Getter
    @Setter
    private String race;

    @OneToMany(mappedBy = "student")
    @Getter
    private List<Appointment> appointments = new ArrayList<>();

    @OneToMany(mappedBy = "student")
    @Getter
    private List<Answer> answerList = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "fk_id_turma")
    @Getter
    @Setter
    private Class determinedClass;

    @Column(name = "score_humanas")
    @Getter @Setter
    private Double humanitiesScore = 0.0;

    @Column(name = "score_exatas")
    @Getter @Setter
    private Double exactSciencesScore = 0.0;

    @Column(name = "score_biologicas")
    @Getter @Setter
    private Double biologicalSciencesScore = 0.0;

    @Column(name = "score_artes")
    @Getter @Setter
    private Double artsScore = 0.0;
}
