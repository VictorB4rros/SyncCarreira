package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.QuestionOption;

public record OpcaoPerguntaDTO(
        Long id,
        String textoOpcao,
        Double pesoHumanas,
        Double pesoBiologicas,
        Double pesoExatas,
        Double pesoArte
) {
    public OpcaoPerguntaDTO(QuestionOption opcao) {
        this(
                opcao.getId(),
                opcao.getTextoOpcao(),
                opcao.getPesoHumanas(),
                opcao.getPesoBiologicas(),
                opcao.getPesoExatas(),
                opcao.getPesoArte()
        );
    }
}
