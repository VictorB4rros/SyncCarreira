package com.synccarreira.synccarreira_api.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "tb_psicologa",
    uniqueConstraints = @UniqueConstraint(columnNames = {"nome_psicologa", "crp_psicologa"})
)
@PrimaryKeyJoinColumn(name = "pk_psicologa")
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = false)
public class Psicologa extends User {

    @Column(name = "nome_psicologa", nullable = false)
    @Getter
    @Setter
    private String nomePsicologa;

    @Column(name = "crp_psicologa", nullable = false)
    @Getter
    @Setter
    private String crp;

    @Column(name = "data_venc_contrato", nullable = false)
    @Getter
    @Setter
    private LocalDate dataVencContrato;

    @OneToMany(mappedBy = "psicologa", cascade = CascadeType.ALL, orphanRemoval = true)
    @Getter
    private List<Pergunta> perguntas = new ArrayList<>();

    // Agendamentos serão mapeados pelo colega na entidade Agendamento
    // @OneToMany(mappedBy = "psicologa")
    // private List<Agendamento> agendamentos = new ArrayList<>();

    /**
     * Verifica se o contrato da psicóloga ainda está dentro da validade.
     * Regra: a data de vencimento deve ser hoje ou futura.
     */
    public boolean isContratoValido() {
        return dataVencContrato != null && !dataVencContrato.isBefore(LocalDate.now());
    }
}
