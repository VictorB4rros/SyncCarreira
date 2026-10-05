package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.entities.PasswordRecover;
import com.synccarreira.synccarreira_api.repositories.PasswordRecoverRepository;
import com.synccarreira.synccarreira_api.services.events.EmailEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PasswordRecoverService {

    private static final String FIRST_ACCESS_SUBJECT = "SyncCarreira - Primeiro Acesso";

    @Value("${email.password-recover.token.minutes}")
    private Long tokenMinutes;

    @Value("${email.password-recover.uri}")
    private String recoverUri;

    private final PasswordRecoverRepository passwordRecoverRepository;

    private final ApplicationEventPublisher eventPublisher;

    public PasswordRecoverService(
            final PasswordRecoverRepository passwordRecoverRepository,
            final ApplicationEventPublisher eventPublisher) {
        this.passwordRecoverRepository = passwordRecoverRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public void sendFirstAccessEmail(String name, String email) {
        String token = UUID.randomUUID().toString();

        PasswordRecover passwordRecover = new PasswordRecover();
        passwordRecover.setEmail(email);
        passwordRecover.setToken(token);
        passwordRecover.setExpiration(Instant.now().plusSeconds(tokenMinutes * 60L));
        passwordRecoverRepository.save(passwordRecover);

        Map<String, Object> map = new HashMap<>();
        map.put("recipientName", name);
        map.put("email", email);
        map.put("link", recoverUri + token);

        eventPublisher.publishEvent(new EmailEvent(email, FIRST_ACCESS_SUBJECT, map));
    }
}
