package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.TipoPergunta;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_pergunta")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Pergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pk_pergunta")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "enunciado_pergunta", nullable = false, length = 500)
    @Getter
    @Setter
    private String enunciado;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pergunta", nullable = false)
    @Getter
    @Setter
    private TipoPergunta tipoPergunta;

    @ManyToOne
    @JoinColumn(name = "fk_trilha", nullable = false)
    @Getter
    @Setter
    private Trilha trilha;

    @ManyToOne
    @JoinColumn(name = "fk_psicologa", nullable = false)
    @Getter
    @Setter
    private Psicologa psicologa;

    // Opções só existem para perguntas que não são do tipo ABERTA
    @OneToMany(mappedBy = "pergunta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter
    private List<OpcaoPergunta> opcoes = new ArrayList<>();

    /**
     * Verifica se este tipo de pergunta aceita opções com pesos.
     * Perguntas abertas não possuem opções.
     */
    public boolean aceitaOpcoes() {
        return tipoPergunta != null && tipoPergunta != TipoPergunta.ABERTA;
    }
}
