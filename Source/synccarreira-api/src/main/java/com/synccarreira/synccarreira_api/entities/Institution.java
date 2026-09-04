package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_instituicao")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_instituicao")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "nome_instituicao")
    @Getter
    @Setter
    private String name;

    @Column(name = "cnpj_instituicao")
    @Getter
    @Setter
    private String cnpj;

    @Column(name = "ativo")
    @Getter
    @Setter
    private boolean active;

    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL)
    @Getter
    private List<Class> classList = new ArrayList<>();
}
