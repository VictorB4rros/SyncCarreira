package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.entities.PasswordRecover;
import com.synccarreira.synccarreira_api.repositories.PasswordRecoverRepository;
import com.synccarreira.synccarreira_api.services.events.EmailEvent;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
public class PasswordRecoverServiceTests {

    @InjectMocks
    private PasswordRecoverService service;

    @Mock
    private PasswordRecoverRepository passwordRecoverRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private Long tokenMinutes;
    private String recoverUri, recipientName, recipientEmail;

    @BeforeEach
    void setUp() {
        tokenMinutes = 1440L;
        recoverUri = "http://localhost:5173/new-password?token=";
        recipientName = "Ana Souza";
        recipientEmail = "ana.souza@gmail.com";

        ReflectionTestUtils.setField(service, "tokenMinutes", tokenMinutes);
        ReflectionTestUtils.setField(service, "recoverUri", recoverUri);
    }

    @Test
    void sendFirstAccessEmailShouldSavePasswordRecoverWithTokenAndExpiration() {
        ArgumentCaptor<PasswordRecover> captor = ArgumentCaptor.forClass(PasswordRecover.class);
        Instant before = Instant.now();

        service.sendFirstAccessEmail(recipientName, recipientEmail);

        Instant after = Instant.now();
        Mockito.verify(passwordRecoverRepository).save(captor.capture());
        PasswordRecover result = captor.getValue();

        Assertions.assertEquals(recipientEmail, result.getEmail());
        Assertions.assertNotNull(result.getToken());
        Assertions.assertFalse(result.getToken().isBlank());
        Assertions.assertFalse(result.getExpiration().isBefore(before.plusSeconds(tokenMinutes * 60L)));
        Assertions.assertFalse(result.getExpiration().isAfter(after.plusSeconds(tokenMinutes * 60L)));
    }

    @Test
    void sendFirstAccessEmailShouldPublishEmailEventWithLinkContainingSavedToken() {
        ArgumentCaptor<PasswordRecover> passwordRecoverCaptor = ArgumentCaptor.forClass(PasswordRecover.class);
        ArgumentCaptor<EmailEvent> eventCaptor = ArgumentCaptor.forClass(EmailEvent.class);

        service.sendFirstAccessEmail(recipientName, recipientEmail);

        Mockito.verify(passwordRecoverRepository).save(passwordRecoverCaptor.capture());
        Mockito.verify(eventPublisher).publishEvent(eventCaptor.capture());
        String token = passwordRecoverCaptor.getValue().getToken();
        EmailEvent result = eventCaptor.getValue();

        Assertions.assertEquals(recipientEmail, result.to());
        Assertions.assertEquals("SyncCarreira - Primeiro Acesso", result.subject());
        Assertions.assertEquals(3, result.templateModel().size());
        Assertions.assertEquals(recipientName, result.templateModel().get("recipientName"));
        Assertions.assertEquals(recipientEmail, result.templateModel().get("email"));
        Assertions.assertEquals(recoverUri + token, result.templateModel().get("link"));
    }

    @Test
    void sendFirstAccessEmailShouldGenerateDifferentTokensForEachCall() {
        ArgumentCaptor<PasswordRecover> captor = ArgumentCaptor.forClass(PasswordRecover.class);

        service.sendFirstAccessEmail(recipientName, recipientEmail);
        service.sendFirstAccessEmail(recipientName, recipientEmail);

        Mockito.verify(passwordRecoverRepository, Mockito.times(2)).save(captor.capture());

        Assertions.assertNotEquals(captor.getAllValues().getFirst().getToken(), captor.getAllValues().getLast().getToken());
    }

    @Test
    void sendFirstAccessEmailShouldNotPublishEmailEventWhenSaveFails() {
        Mockito.when(passwordRecoverRepository.save(any())).thenThrow(DataIntegrityViolationException.class);

        Assertions.assertThrows(DataIntegrityViolationException.class, () -> {
            service.sendFirstAccessEmail(recipientName, recipientEmail);
        });

        Mockito.verify(eventPublisher, Mockito.never()).publishEvent(any());
    }
}
