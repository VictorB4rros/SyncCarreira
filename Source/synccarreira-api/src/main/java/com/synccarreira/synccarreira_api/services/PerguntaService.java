package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.OpcaoPerguntaDTO;
import com.synccarreira.synccarreira_api.dto.PerguntaDTO;
import com.synccarreira.synccarreira_api.entities.QuestionOption;
import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Trail;
import com.synccarreira.synccarreira_api.entities.enums.QuestionType;
import com.synccarreira.synccarreira_api.repositories.QuestionRepository;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.repositories.TrailRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PerguntaService {

    private static final int LIMITE_PERGUNTAS_POR_TRILHA = 10;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private TrailRepository trailRepository;

    @Autowired
    private PsychologistRepository psicologaRepository;

    @Autowired
    private PsicologaService psicologaService;

    @Transactional(readOnly = true)
    public List<PerguntaDTO> findAll() {
        return questionRepository.findAll()
                .stream()
                .map(PerguntaDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public PerguntaDTO findById(Long id) {
        return new PerguntaDTO(buscarOuLancarExcecao(id));
    }

    @Transactional(readOnly = true)
    public List<PerguntaDTO> findByTrilha(Long trilhaId) {
        return perguntaRepository.findByTrilhaId(trilhaId)
                .stream()
                .map(PerguntaDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PerguntaDTO> findByPsicologa(Long psicologaId) {
        return perguntaRepository.findByPsicologaId(psicologaId)
                .stream()
                .map(PerguntaDTO::new)
                .toList();
    }

    @Transactional
    public PerguntaDTO create(PerguntaDTO dto) {
        // 1. Valida contrato da psicóloga
        psicologaService.validarContratoAtivo(dto.psicologaId());

        // 2. Busca e valida entidades relacionadas
        Trilha trilha = trailRepository.findById(dto.trilhaId())
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + dto.trilhaId()));

        Psicologa psicologa = psicologaRepository.findById(dto.psicologaId())
                .orElseThrow(() -> new EntityNotFoundException("Psicóloga não encontrada. ID: " + dto.psicologaId()));

        // 3. Valida limite de perguntas por trilha
        long total = perguntaRepository.countByTrilhaId(dto.trilhaId());
        if (total >= LIMITE_PERGUNTAS_POR_TRILHA) {
            throw new IllegalStateException(
                    "A trilha '" + trilha.getNome() + "' já atingiu o limite de " +
                    LIMITE_PERGUNTAS_POR_TRILHA + " perguntas.");
        }

        // 4. Monta a entidade Pergunta
        Question pergunta = new Question();
        pergunta.setEnunciado(dto.enunciado());
        pergunta.setTipoPergunta(dto.tipoPergunta());
        pergunta.setTrilha(trilha);
        pergunta.setPsicologa(psicologa);

        // 5. Adiciona opções apenas se o tipo aceitar (não ABERTA)
        if (pergunta.aceitaOpcoes()) {
            validarOpcoes(dto.opcoes());
            adicionarOpcoes(pergunta, dto.opcoes());
        }

        pergunta = perguntaRepository.save(pergunta);
        return new PerguntaDTO(pergunta);
    }

    @Transactional
    public PerguntaDTO update(Long id, PerguntaDTO dto) {
        // 1. Valida contrato da psicóloga
        psicologaService.validarContratoAtivo(dto.psicologaId());

        Question pergunta = buscarOuLancarExcecao(id);

        Trilha trilha = trailRepository.findById(dto.trilhaId())
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + dto.trilhaId()));

        Psicologa psicologa = psicologaRepository.findById(dto.psicologaId())
                .orElseThrow(() -> new EntityNotFoundException("Psicóloga não encontrada. ID: " + dto.psicologaId()));

        pergunta.setEnunciado(dto.enunciado());
        pergunta.setTipoPergunta(dto.tipoPergunta());
        pergunta.setTrilha(trilha);
        pergunta.setPsicologa(psicologa);

        // Limpa opções antigas e reaplica
        pergunta.getOpcoes().clear();
        if (pergunta.aceitaOpcoes()) {
            validarOpcoes(dto.opcoes());
            adicionarOpcoes(pergunta, dto.opcoes());
        }

        pergunta = perguntaRepository.save(pergunta);
        return new PerguntaDTO(pergunta);
    }

    @Transactional
    public void delete(Long id, Long psicologaId) {
        // Valida contrato antes de excluir
        psicologaService.validarContratoAtivo(psicologaId);

        if (!perguntaRepository.existsById(id)) {
            throw new EntityNotFoundException("Pergunta não encontrada. ID: " + id);
        }
        perguntaRepository.deleteById(id);
    }

    // --- Métodos auxiliares privados ---

    private Question buscarOuLancarExcecao(Long id) {
        return perguntaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Pergunta não encontrada. ID: " + id));
    }

    private void validarOpcoes(List<OpcaoPerguntaDTO> opcoes) {
        if (opcoes == null || opcoes.isEmpty()) {
            throw new IllegalArgumentException(
                    "Perguntas de múltipla escolha, checkbox ou Likert devem ter ao menos uma opção.");
        }
    }

    private void adicionarOpcoes(Question pergunta, List<OpcaoPerguntaDTO> opcaoDTOs) {
        for (OpcaoPerguntaDTO opcaoDTO : opcaoDTOs) {
            QuestionOption opcao = new QuestionOption();
            opcao.setTextoOpcao(opcaoDTO.textoOpcao());
            opcao.setPesoHumanas(opcaoDTO.pesoHumanas());
            opcao.setPesoBiologicas(opcaoDTO.pesoBiologicas());
            opcao.setPesoExatas(opcaoDTO.pesoExatas());
            opcao.setPesoArte(opcaoDTO.pesoArte());
            opcao.setPergunta(pergunta);
            pergunta.getOpcoes().add(opcao);
        }
    }
}
