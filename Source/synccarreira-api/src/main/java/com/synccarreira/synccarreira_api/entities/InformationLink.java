package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tb_link_informacao")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class InformationLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_link_informacao")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "topico_link", nullable = false)
    @Getter
    @Setter
    private String topic;

    @Column(name = "url_link", nullable = false, length = 500)
    @Getter
    @Setter
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "area_conhecimento")
    @Getter
    @Setter
    private KnowledgeArea knowledgeArea;
}
