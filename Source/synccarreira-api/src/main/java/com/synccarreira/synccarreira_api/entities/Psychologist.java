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
@NoArgsConstructor
@AllArgsConstructor
public class Psychologist extends User {

    @Column(name = "crp_psicologa", nullable = false)
    @Getter
    @Setter
    private String crp;

    @Column(name = "data_venc_contrato", nullable = false)
    @Getter
    @Setter
    private LocalDate contractExpirationDate;

    @OneToMany(mappedBy = "psychologist")
    @Getter
    private List<Schedule> schedules = new ArrayList<>();

    public boolean isContractValid() {
        return contractExpirationDate != null && !contractExpirationDate.isBefore(LocalDate.now());
    }
}
