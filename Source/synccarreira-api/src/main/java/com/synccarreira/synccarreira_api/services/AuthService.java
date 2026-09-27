package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // Mensagem genérica de propósito: não revela se o e-mail existe ou não (evita enumeração de usuários)
    private static final String NOT_AUTHENTICATED = "Usuário não autenticado.";

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    /**
     * Retorna o usuário dono do token JWT da requisição atual.
     * Lança AuthenticationCredentialsNotFoundException (401) se não houver token válido
     * ou se o usuário do token não existir mais.
     * Erros de banco não são mais engolidos aqui: aparecem no log como 500.
     */
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
}