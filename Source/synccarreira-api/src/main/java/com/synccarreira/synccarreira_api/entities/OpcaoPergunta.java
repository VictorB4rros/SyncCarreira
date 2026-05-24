package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_opcao_pergunta")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OpcaoPergunta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pk_opcao_pergunta")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "texto_opcao", nullable = false)
    @Getter
    @Setter
    private String textoOpcao;

    @Column(name = "peso_humanas", nullable = false)
    @Getter
    @Setter
    private Double pesoHumanas;

    @Column(name = "peso_biologicas", nullable = false)
    @Getter
    @Setter
    private Double pesoBiologicas;

    @Column(name = "peso_exatas", nullable = false)
    @Getter
    @Setter
    private Double pesoExatas;

    @Column(name = "peso_arte", nullable = false)
    @Getter
    @Setter
    private Double pesoArte;

    @ManyToOne
    @JoinColumn(name = "fk_pergunta", nullable = false)
    @Getter
    @Setter
    private Pergunta pergunta;
}
