package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
public class NewPasswordDTO {

    @NotBlank(message = "Campo obrigatório")
    @Getter
    @Setter
    private String token;

    @NotBlank(message = "Campo obrigatório")
    @Size(min = 8, message = "Deve ter no mínimo 8 caracteres")
    @Getter
    @Setter
    private String password;
}
