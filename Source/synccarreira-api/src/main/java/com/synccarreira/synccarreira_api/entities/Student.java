package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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

    @OneToMany(mappedBy = "student")
    @Getter
    private List<Answer> answerList = new ArrayList<>();
}
