package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_turma")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Class {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_turma")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "nome_turma")
    @Getter
    @Setter
    private String name;

    @ManyToOne
    @JoinColumn(name = "fk_id_instituicao")
    @Getter
    @Setter
    private Institution institution;
}
