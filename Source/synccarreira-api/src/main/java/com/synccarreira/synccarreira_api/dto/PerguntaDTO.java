package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.entities.enums.TipoPergunta;

import java.util.List;

public record PerguntaDTO(
        Long id,
        String enunciado,
        TipoPergunta tipoPergunta,
        Long trilhaId,
        Long psicologaId,
        List<OpcaoPerguntaDTO> opcoes
) {
    public PerguntaDTO(Question pergunta) {
        this(
                pergunta.getId(),
                pergunta.getEnunciado(),
                pergunta.getTipoPergunta(),
                pergunta.getTrilha().getId(),
                pergunta.getPsicologa().getId(),
                pergunta.getOpcoes()
                        .stream()
                        .map(OpcaoPerguntaDTO::new)
                        .toList()
        );
    }
}
