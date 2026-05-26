package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.TrailName;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_trilha")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Trail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pk_trilha")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "nome_trilha", nullable = false, unique = true)
    @Getter
    @Setter
    private TrailName name;

    @Column(name = "ordem_sequencial_trilha", nullable = false, unique = true)
    @Getter
    @Setter
    private Integer sequentialOrder;

    @OneToMany(mappedBy = "trilha", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter
    private List<Pergunta> perguntas = new ArrayList<>();

    // Verifica se todas as perguntas da trilha foram respondidas por um aluno
    public boolean isConcluida(List<Long> idsRespondidos) {
        return perguntas.stream()
                .allMatch(p -> idsRespondidos.contains(p.getId()));
    }
}
