package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_questionario_padrao")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DefaultSystemQuestionnaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_questionario_padrao")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @OneToMany(mappedBy = "template")
    @Getter
    List<Question> defaultQuestions = new ArrayList<>();

}
