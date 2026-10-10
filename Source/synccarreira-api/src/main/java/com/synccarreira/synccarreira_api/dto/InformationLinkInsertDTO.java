package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Sem área de conhecimento o link é exibido na seção de acesso à universidade
public record InformationLinkInsertDTO(
        @NotBlank(message = "Campo obrigatório")
        @Size(max = 255, message = "O tópico deve ter no máximo 255 caracteres")
        String topic,

        @NotBlank(message = "Campo obrigatório")
        @Size(max = 500, message = "A URL deve ter no máximo 500 caracteres")
        @Pattern(regexp = "^\\s*https?://\\S+\\s*$", message = "URL inválida: deve começar com http:// ou https://")
        String url,

        KnowledgeArea knowledgeArea
) {
}
