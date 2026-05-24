package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
}
