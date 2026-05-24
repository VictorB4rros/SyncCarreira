package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.NomeTrilha;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_trilha")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Trilha {

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
    private NomeTrilha nome;

    @Column(name = "ordem_sequencial_trilha", nullable = false, unique = true)
    @Getter
    @Setter
    private Integer ordemSequencial;

    @OneToMany(mappedBy = "trilha", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter
    private List<Pergunta> perguntas = new ArrayList<>();

    // Verifica se todas as perguntas da trilha foram respondidas por um aluno
    public boolean isConcluida(List<Long> idsRespondidos) {
        return perguntas.stream()
                .allMatch(p -> idsRespondidos.contains(p.getId()));
    }
}
