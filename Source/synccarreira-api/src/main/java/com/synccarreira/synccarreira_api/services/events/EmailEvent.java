package com.synccarreira.synccarreira_api.services.events;

import java.util.Map;

public record EmailEvent(String to, String subject, String templateName, Map<String, Object> templateModel) {
}
