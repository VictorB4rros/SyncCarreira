package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

// Síntese textual que o aluno escreve ao concluir uma trilha.
@Entity
@Table(name = "tb_sintese",
        uniqueConstraints = @UniqueConstraint(name = "uk_sintese_aluno_trilha", columnNames = {"fk_aluno", "fk_trilha"}))
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Synthesis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sintese")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "conteudo_sintese", nullable = false, columnDefinition = "TEXT")
    @Getter
    @Setter
    private String content;

    // Ao excluir o aluno, o banco exclui as sínteses dele junto
    @ManyToOne
    @JoinColumn(name = "fk_aluno", nullable = false, foreignKey = @ForeignKey(name = "fk_sintese_aluno"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Getter
    @Setter
    private Student student;

    @ManyToOne
    @JoinColumn(name = "fk_trilha", nullable = false, foreignKey = @ForeignKey(name = "fk_sintese_trilha"))
    @Getter
    @Setter
    private Trail trail;

    @Column(name = "data_criacao", nullable = false)
    @Getter
    @Setter
    private Instant createdAt;
}
