package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "tb_turma")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SchoolClass implements Serializable {

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

    @Column(name = "ano_letivo", nullable = false)
    @Getter
    @Setter
    private Integer schoolYear;

    @ManyToOne
    @JoinColumn(name = "fk_id_instituicao")
    @Getter
    @Setter
    private Institution institution;

    @Column(name = "criado_em", nullable = false)
    @Getter
    @Setter
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
