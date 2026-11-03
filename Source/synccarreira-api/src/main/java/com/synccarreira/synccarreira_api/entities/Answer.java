package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "tb_respostas_aluno")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_resposta")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    // Ao excluir o aluno, as respostas dele são excluídas junto pelo banco (ON DELETE CASCADE)
    @ManyToOne
    @JoinColumn(name = "fk_usuario", foreignKey = @ForeignKey(name = "fk_resposta_aluno"))
    @OnDelete(action = OnDeleteAction.CASCADE)
    @Getter
    @Setter
    private Student student;

    @ManyToOne
    @JoinColumn(name = "fk_opcao_pergunta")
    @Getter
    @Setter
    private QuestionOption questionOption;

}
