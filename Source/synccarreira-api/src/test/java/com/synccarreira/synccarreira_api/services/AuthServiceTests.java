package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.NewPasswordDTO;
import com.synccarreira.synccarreira_api.entities.PasswordRecover;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.PasswordRecoverRepository;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @InjectMocks
    private AuthService service;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordRecoverRepository passwordRecoverRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private String existingEmail, validToken, invalidToken, newPassword, encodedPassword;
    private User user;
    private PasswordRecover passwordRecover;
    private NewPasswordDTO validTokenNewPasswordDTO, invalidTokenNewPasswordDTO;

    @BeforeEach
    void setUp() {
        existingEmail = "lorena.psi@gmail.com";
        validToken = "3f1c9a2e-7b4d-4e8a-9c6f-1d2b3a4c5e6f";
        invalidToken = "00000000-0000-0000-0000-000000000000";
        newPassword = "novaSenha123";
        encodedPassword = "$2a$10$senhaCodificada";

        user = new User();
        user.setId(1L);
        user.setEmail(existingEmail);

        passwordRecover = new PasswordRecover();
        passwordRecover.setId(1L);
        passwordRecover.setEmail(existingEmail);
        passwordRecover.setToken(validToken);
        passwordRecover.setExpiration(Instant.now().plusSeconds(3600L));

        validTokenNewPasswordDTO = new NewPasswordDTO(validToken, newPassword);
        invalidTokenNewPasswordDTO = new NewPasswordDTO(invalidToken, newPassword);
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

    @Test
    void saveNewPasswordShouldSaveEncodedPasswordWhenTokenIsValid() {
        ArgumentCaptor<Instant> captor = ArgumentCaptor.forClass(Instant.class);
        Mockito.when(passwordRecoverRepository.searchValidTokens(eq(validToken), any(Instant.class))).thenReturn(List.of(passwordRecover));
        Mockito.when(userRepository.findByEmail(existingEmail)).thenReturn(user);
        Mockito.when(passwordEncoder.encode(newPassword)).thenReturn(encodedPassword);
        Instant before = Instant.now();

        Assertions.assertDoesNotThrow(() -> {
            service.saveNewPassword(validTokenNewPasswordDTO);
        });

        Instant after = Instant.now();
        Mockito.verify(passwordRecoverRepository).searchValidTokens(eq(validToken), captor.capture());
        Mockito.verify(userRepository).save(user);
        Mockito.verify(passwordRecoverRepository).deleteByEmail(existingEmail);

        Assertions.assertEquals(encodedPassword, user.getPassword());
        Assertions.assertFalse(captor.getValue().isBefore(before));
        Assertions.assertFalse(captor.getValue().isAfter(after));
    }

    @Test
    void saveNewPasswordShouldReturnResourceNotFoundExceptionWhenTokenIsInvalidOrExpired() {
        Mockito.when(passwordRecoverRepository.searchValidTokens(eq(invalidToken), any(Instant.class))).thenReturn(List.of());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.saveNewPassword(invalidTokenNewPasswordDTO);
        });

        Mockito.verify(userRepository, Mockito.never()).findByEmail(anyString());
        Mockito.verify(passwordEncoder, Mockito.never()).encode(anyString());
        Mockito.verify(userRepository, Mockito.never()).save(any());
        Mockito.verify(passwordRecoverRepository, Mockito.never()).deleteByEmail(anyString());
    }

    @Test
    void saveNewPasswordShouldReturnResourceNotFoundExceptionWhenTokenIsValidAndUserDoesNotExist() {
        Mockito.when(passwordRecoverRepository.searchValidTokens(eq(validToken), any(Instant.class))).thenReturn(List.of(passwordRecover));
        Mockito.when(userRepository.findByEmail(existingEmail)).thenReturn(null);

        Assertions.assertThrows(ResourceNotFoundException.class, () -> {
            service.saveNewPassword(validTokenNewPasswordDTO);
        });

        Mockito.verify(passwordEncoder, Mockito.never()).encode(anyString());
        Mockito.verify(userRepository, Mockito.never()).save(any());
        Mockito.verify(passwordRecoverRepository, Mockito.never()).deleteByEmail(anyString());
    }
}