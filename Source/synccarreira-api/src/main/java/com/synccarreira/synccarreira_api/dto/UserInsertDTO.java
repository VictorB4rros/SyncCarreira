package com.synccarreira.synccarreira_api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

public class UserInsertDTO extends UserDTO {

	@NotBlank(message = "Campo obrigatório")
	@Size(min = 8, message = "Deve ter no mínimo 8 caracteres")
	@Getter
	@Setter
	private String password;

	public UserInsertDTO() {
		super();
	}
}
