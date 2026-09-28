package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.NewPasswordDTO;
import com.synccarreira.synccarreira_api.entities.PasswordRecover;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.PasswordRecoverRepository;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final String NOT_AUTHENTICATED = "Usuário não autenticado.";

    private final PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;

    private final PasswordRecoverRepository passwordRecoverRepository;

    public AuthService(final PasswordEncoder passwordEncoder, final UserRepository userRepository, final PasswordRecoverRepository passwordRecoverRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.passwordRecoverRepository = passwordRecoverRepository;
    }

    protected User authenticated() {
        String username;
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Jwt jwtPrincipal = (Jwt) authentication.getPrincipal();
            username = jwtPrincipal.getClaim("username");
        }
        catch (Exception e) {
            log.warn("Não foi possível ler o usuário do token JWT", e);
            throw new AuthenticationCredentialsNotFoundException(NOT_AUTHENTICATED, e);
        }

        User user = userRepository.findByEmail(username);
        if (user == null) {
            throw new AuthenticationCredentialsNotFoundException(NOT_AUTHENTICATED);
        }
        return user;
    }

    @Transactional
    public void saveNewPassword(@Valid NewPasswordDTO dto) {
        List<PasswordRecover> result = passwordRecoverRepository.searchValidTokens(dto.getToken(), Instant.now());
        if (result.isEmpty()) {
            throw new ResourceNotFoundException("Token inválido");
        }
        User user = userRepository.findByEmail(result.getFirst().getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        userRepository.save(user);
    }
}