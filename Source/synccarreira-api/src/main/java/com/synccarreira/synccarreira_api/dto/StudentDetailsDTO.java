package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class StudentDetailsDTO {

    @Getter
    private Long id;

    @NotBlank(message = "Campo obrigatório")
    @Getter
    private String name;

    @Email(message = "Favor entrar com email válido")
    @Getter
    private String email;

    @Getter
    private String schollarYear;

    @Getter
    private String schoolType;

    @Getter
    private String race;

    @Getter
    private String className;

    @Getter
    private String institutionName;
}
