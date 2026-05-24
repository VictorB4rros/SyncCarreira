package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_resposta")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pk_resposta")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "conteudo")
    @Getter
    @Setter
    private String content;

    @ManyToOne
    @JoinColumn(name = "pk_usuario")
    @Getter
    @Setter
    private Student student;

    /*   Atributo question que vai ligar a classe Answer à Question, quando essa classe existir

         @ManyToOne
         @JoinColumn(name = "pk_pergunta")
         @Getter
         @Setter
         private Question question;
     */

}
