package com.synccarreira.synccarreira_api.services.validation;

import com.synccarreira.synccarreira_api.dto.UserUpdateDTO;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.mockito.Mockito;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;

public class UserUpdateValidatorTests {

    private HttpServletRequest request;
    private UserRepository repository;
    private ConstraintValidatorContext context;
    private UserUpdateDTO dto;
    private UserUpdateValidator validator;

    private Long userId, otherUserId;
    private String email;

    @BeforeEach
    void setUp() {
        request = Mockito.mock(HttpServletRequest.class);
        repository = Mockito.mock(UserRepository.class);
        context = Mockito.mock(ConstraintValidatorContext.class, Answers.RETURNS_DEEP_STUBS);
        dto = Mockito.mock(UserUpdateDTO.class);
        validator = new UserUpdateValidator(request, repository);
        validator.initialize(null);

        userId = 1L;
        otherUserId = 2L;
        email = "ana.souza@gmail.com";

        // Simula a requisição PUT /users/{id} para o usuário que está sendo atualizado
        Mockito.when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
                .thenReturn(Map.of("id", userId.toString()));
        Mockito.when(dto.getEmail()).thenReturn(email);
    }

    private static User userWithId(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }

    @Test
    void isValidShouldReturnFalseAndRegisterViolationWhenEmailBelongsToAnotherUser() {
        Mockito.when(repository.findByEmail(email)).thenReturn(userWithId(otherUserId, email));

        Assertions.assertFalse(validator.isValid(dto, context));
        Mockito.verify(context).disableDefaultConstraintViolation();
        Mockito.verify(context).buildConstraintViolationWithTemplate("Email já existe");
    }

    @Test
    void isValidShouldReturnTrueWhenEmailBelongsToTheSameUser() {
        Mockito.when(repository.findByEmail(email)).thenReturn(userWithId(userId, email));

        Assertions.assertTrue(validator.isValid(dto, context));
        Mockito.verify(context, Mockito.never()).disableDefaultConstraintViolation();
    }

    @Test
    void isValidShouldReturnTrueWhenEmailDoesNotExist() {
        Mockito.when(repository.findByEmail(email)).thenReturn(null);

        Assertions.assertTrue(validator.isValid(dto, context));
        Mockito.verify(context, Mockito.never()).disableDefaultConstraintViolation();
    }
}
