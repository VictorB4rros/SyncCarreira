package com.synccarreira.synccarreira_api.entities;

import com.synccarreira.synccarreira_api.entities.enums.InstitutionType;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_instituicao")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Institution implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_instituicao")
    @EqualsAndHashCode.Include
    @Getter
    @Setter
    private Long id;

    @Column(name = "razao_social", nullable = false)
    @Getter
    @Setter
    private String legalName;

    @Column(name = "nome_fantasia")
    @Getter
    @Setter
    private String tradeName;

    @Column(name = "cnpj_instituicao")
    @Getter
    @Setter
    private String cnpj;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_instituicao", nullable = false, length = 20)
    @Getter
    @Setter
    private InstitutionType type;

    @Column(name = "ativo")
    @Getter
    @Setter
    private Boolean active;

    @Column(name = "criado_em", nullable = false)
    @Getter
    @Setter
    private Instant createdAt;

    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL)
    @Getter
    private List<SchoolClass> schoolClassList = new ArrayList<>();

    public Institution(Long id, String legalName, String tradeName, String cnpj, InstitutionType type, Boolean active, Instant createdAt) {
        this.id = id;
        this.legalName = legalName;
        this.tradeName = tradeName;
        this.cnpj = cnpj;
        this.type = type;
        this.active = active;
        this.createdAt = createdAt;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (active == null) {
            active = true;
        }
    }
}
