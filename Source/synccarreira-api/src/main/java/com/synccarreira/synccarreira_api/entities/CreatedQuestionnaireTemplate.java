package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_modelo_questionario_customizado")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CreatedQuestionnaireTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_modelo")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @OneToMany(mappedBy = "template")
    @Getter
    List<Question> createdQuestions = new ArrayList<>();
}
