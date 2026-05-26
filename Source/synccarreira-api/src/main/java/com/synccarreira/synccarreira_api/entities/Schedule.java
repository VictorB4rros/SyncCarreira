package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(name = "tipo_agendamento")
    @Getter
    @Setter
    private String scheduleType;

    @Column(name = "status_agendamento")
    @Getter
    @Setter
    private String scheduleStatus;

    @Column(name = "fk_aluno")
    @Getter
    @Setter
    private Student student;

    @Column(name = "fk_psicologa")
    @Getter
    @Setter
    private Psychologist psychologist;

}
