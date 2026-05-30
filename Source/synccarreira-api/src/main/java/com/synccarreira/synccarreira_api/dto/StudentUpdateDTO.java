package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.services.validation.UserUpdateValid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@UserUpdateValid
public class StudentUpdateDTO {

    @NotBlank(message = "Campo obrigatório")
    @Getter
    private String name;

    @Email(message = "Favor entrar com email válido")
    @Getter
    private String email;

    @Getter
    private Long roleId;

    @Getter
    private String schollarYear;

    @Getter
    private String schoolType;
}
