package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.ScheduleStatus;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tb_agendamento")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_agendamento")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "titulo", nullable = false)
    @Getter
    @Setter
    private String title;

    @Column(name = "descricao", columnDefinition = "TEXT")
    @Getter
    @Setter
    private String description;

    @Column(name = "data_horario", nullable = false)
    @Getter
    @Setter
    private LocalDateTime dateTime;

    @Column(name = "duracao_minutos", nullable = false)
    @Getter
    @Setter
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_agendamento", nullable = false)
    @Getter
    @Setter
    private ScheduleType scheduleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_agendamento", nullable = false)
    @Getter
    @Setter
    private ScheduleStatus scheduleStatus;

    @ManyToMany
    @JoinTable(name = "tb_agendamento_aluno",
            joinColumns = @JoinColumn(name = "fk_agendamento"),
            inverseJoinColumns = @JoinColumn(name = "fk_aluno"))
    @Getter
    private Set<Student> students = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "fk_psicologa", nullable = false)
    @Getter
    @Setter
    private Psychologist psychologist;

    @Column(name = "google_event_id")
    @Getter
    @Setter
    private String googleEventId;

    @Column(name = "link_meet")
    @Getter
    @Setter
    private String meetLink;

    @Column(name = "link_calendar", length = 1000)
    @Getter
    @Setter
    private String calendarLink;

    @Column(name = "feedback", columnDefinition = "TEXT")
    @Getter
    @Setter
    private String feedback;

    @Column(name = "data_feedback")
    @Getter
    @Setter
    private LocalDateTime feedbackDate;

    @Column(name = "motivo_cancelamento", length = 1000)
    @Getter
    @Setter
    private String cancelReason;
}
