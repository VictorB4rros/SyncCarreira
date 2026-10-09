package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.services.events.EmailEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EmailEventListener {

    private static final Logger log = LoggerFactory.getLogger(EmailEventListener.class);

    private final EmailService emailService;

    public EmailEventListener(final EmailService emailService) {
        this.emailService = emailService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEmailEvent(EmailEvent event) {
        try {
            emailService.sendMessageUsingThymeleafTemplate(event.to(), event.subject(), event.templateName(), event.templateModel());
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail para {}: {}", event.to(), e.getMessage(), e);
        }
    }
}
