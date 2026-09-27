package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @InjectMocks
    private AuthService service;

    @Mock
    private UserRepository userRepository;

    private String existingEmail;
    private User user;

    @BeforeEach
    void setUp() {
        existingEmail = "lorena.psi@gmail.com";
        user = new User();
        user.setId(1L);
        user.setEmail(existingEmail);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /** Simula uma requisição autenticada com um JWT contendo a claim "username". */
    private static void authenticateWithJwt(String username) {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("username", username)
                .build();
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(jwt, null));
    }

    @Test
    void authenticatedShouldReturnUserWhenJwtUsernameExists() {
        authenticateWithJwt(existingEmail);
        Mockito.when(userRepository.findByEmail(existingEmail)).thenReturn(user);

        User result = service.authenticated();

        Assertions.assertSame(user, result);
    }

    @Test
    void authenticatedShouldThrowWhenJwtUsernameDoesNotExist() {
        authenticateWithJwt("naoexiste@gmail.com");
        Mockito.when(userRepository.findByEmail("naoexiste@gmail.com")).thenReturn(null);

        Assertions.assertThrows(AuthenticationCredentialsNotFoundException.class, () -> service.authenticated());
    }

    @Test
    void authenticatedShouldThrowWhenThereIsNoAuthentication() {
        SecurityContextHolder.clearContext();

        Assertions.assertThrows(AuthenticationCredentialsNotFoundException.class, () -> service.authenticated());

        Mockito.verify(userRepository, Mockito.never()).findByEmail(anyString());
    }

    @Test
    void authenticatedShouldThrowWhenPrincipalIsNotJwt() {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("anonymousUser", null));

        Assertions.assertThrows(AuthenticationCredentialsNotFoundException.class, () -> service.authenticated());

        Mockito.verify(userRepository, Mockito.never()).findByEmail(anyString());
    }
}