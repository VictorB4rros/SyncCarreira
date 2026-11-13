package com.synccarreira.synccarreira_api.services.validation;

import com.synccarreira.synccarreira_api.dto.FieldMessage;
import com.synccarreira.synccarreira_api.dto.UserInsertDTO;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.ArrayList;
import java.util.List;

public class UserInsertValidator implements ConstraintValidator<UserInsertValid, UserInsertDTO> {
	
	private final UserRepository repository;

	public UserInsertValidator(final UserRepository repository) {
		this.repository = repository;
	}

	@Override
	public void initialize(UserInsertValid ann) {
		// Nenhuma inicialização necessária: a validação não usa atributos da anotação
	}

	@Override
	public boolean isValid(UserInsertDTO dto, ConstraintValidatorContext context) {
		
		List<FieldMessage> list = new ArrayList<>();
		
		User user = repository.findByEmail(dto.getEmail());
		if (user != null) {
			list.add(new FieldMessage("email", "Email já existe"));
		}
		
		for (FieldMessage e : list) {
			context.disableDefaultConstraintViolation();
			context.buildConstraintViolationWithTemplate(e.getMessage()).addPropertyNode(e.getFieldName())
					.addConstraintViolation();
		}
		return list.isEmpty();
	}
}
