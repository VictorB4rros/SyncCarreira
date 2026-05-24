package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_agendamento")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pk_agendamento")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "data_horario")
    @Getter
    @Setter
    private LocalDateTime dateTime;

    @Column(name = "fk_aluno")
    @Getter
    @Setter
    private Student student;

    /* Atributo psychologist que vai ligar a classe Schedule à Psychologist, quando essa classe existir

        @Column(name = "fk_psicologa")
        @Getter
        @Setter
        private Psychologist psychologist;
     */

}
