package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.services.exceptions.EmailException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

@Service
public class EmailService {

    private final JavaMailSender emailSender;

    private final SpringTemplateEngine thymeleafTemplateEngine;

    public EmailService(final JavaMailSender emailSender, final SpringTemplateEngine thymeleafTemplateEngine) {
        this.emailSender = emailSender;
        this.thymeleafTemplateEngine = thymeleafTemplateEngine;
    }

    public void sendHtmlMessage(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = emailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        emailSender.send(message);
    }

    @Retryable(
            retryFor = { MailException.class, EmailException.class },
            noRetryFor = MailAuthenticationException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2))
    public void sendMessageUsingThymeleafTemplate(String to, String subject, Map<String, Object> templateModel) {
        try {
            Context thymeleafContext = new Context();
            thymeleafContext.setVariables(templateModel);
            String htmlBody = thymeleafTemplateEngine.process("template-thymeleaf.html", thymeleafContext);
            sendHtmlMessage(to, subject, htmlBody);
        } catch (MessagingException e) {
            throw new EmailException("Falha no envio do e-mail.");
        }
    }
}
