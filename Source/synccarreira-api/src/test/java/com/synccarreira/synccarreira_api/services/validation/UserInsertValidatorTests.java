package com.synccarreira.synccarreira_api.services.validation;

import com.synccarreira.synccarreira_api.dto.UserInsertDTO;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.mockito.Mockito;

public class UserInsertValidatorTests {

    private UserRepository repository;
    private ConstraintValidatorContext context;
    private UserInsertValidator validator;

    private String existingEmail, newEmail;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(UserRepository.class);
        context = Mockito.mock(ConstraintValidatorContext.class, Answers.RETURNS_DEEP_STUBS);
        validator = new UserInsertValidator(repository);
        validator.initialize(null);

        existingEmail = "ana.souza@gmail.com";
        newEmail = "bruno.lima@gmail.com";
    }

    @Test
    void isValidShouldReturnFalseAndRegisterViolationWhenEmailAlreadyExists() {
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setEmail(existingEmail);
        Mockito.when(repository.findByEmail(existingEmail)).thenReturn(existingUser);
        UserInsertDTO dto = new UserInsertDTO("Ana Souza", existingEmail, 1L, "12345678");

        Assertions.assertFalse(validator.isValid(dto, context));
        Mockito.verify(context).disableDefaultConstraintViolation();
        Mockito.verify(context).buildConstraintViolationWithTemplate("Email já existe");
    }

    @Test
    void isValidShouldReturnTrueWhenEmailDoesNotExist() {
        Mockito.when(repository.findByEmail(newEmail)).thenReturn(null);
        UserInsertDTO dto = new UserInsertDTO("Bruno Lima", newEmail, 1L, "12345678");

        Assertions.assertTrue(validator.isValid(dto, context));
        Mockito.verify(context, Mockito.never()).disableDefaultConstraintViolation();
    }
}
