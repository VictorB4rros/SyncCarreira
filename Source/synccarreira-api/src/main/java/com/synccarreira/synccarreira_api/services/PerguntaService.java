package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.OpcaoPerguntaDTO;
import com.synccarreira.synccarreira_api.dto.QuestionDTO;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.QuestionOption;
import com.synccarreira.synccarreira_api.entities.Question;
import com.synccarreira.synccarreira_api.entities.Trail;
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
    public List<QuestionDTO> findAll() {
        return questionRepository.findAll()
                .stream()
                .map(QuestionDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionDTO findById(Long id) {
        return new QuestionDTO(buscarOuLancarExcecao(id));
    }

    @Transactional(readOnly = true)
    public List<QuestionDTO> findByTrilha(Long trilhaId) {
        return questionRepository.findByTrailId(trilhaId)
                .stream()
                .map(QuestionDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<QuestionDTO> findByPsicologa(Long psicologaId) {
        return questionRepository.findByPsychologistId(psicologaId)
                .stream()
                .map(QuestionDTO::new)
                .toList();
    }

    @Transactional
    public QuestionDTO create(QuestionDTO dto) {
        // 1. Valida contrato da psicóloga
        psicologaService.validarContratoAtivo(dto.psicologaId());

        // 2. Busca e valida entidades relacionadas
        Trail trail = trailRepository.findById(dto.trilhaId())
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + dto.trilhaId()));

        Psychologist psychologist = psicologaRepository.findById(dto.psicologaId())
                .orElseThrow(() -> new EntityNotFoundException("Psicóloga não encontrada. ID: " + dto.psicologaId()));

        // 3. Valida limite de perguntas por trilha
        long total = questionRepository.countByTrailId(dto.trilhaId());
        if (total >= LIMITE_PERGUNTAS_POR_TRILHA) {
            throw new IllegalStateException(
                    "A trilha '" + trail.getName() + "' já atingiu o limite de " +
                            LIMITE_PERGUNTAS_POR_TRILHA + " perguntas.");
        }

        // 4. Monta a entidade Pergunta
        Question question = new Question();
        question.setContent(dto.enunciado());
        question.setQuestionType(dto.questionType());
        question.setTrail(trail);
        question.setPsychologist(psychologist);

        // 5. Adiciona opções apenas se o tipo aceitar (não ABERTA)
        if (question.acceptsOptions()) {
            validarOpcoes(dto.opcoes());
            adicionarOpcoes(question, dto.opcoes());
        }

        question = questionRepository.save(question);
        return new QuestionDTO(question);
    }

    @Transactional
    public QuestionDTO update(Long id, QuestionDTO dto) {
        // 1. Valida contrato da psicóloga
        psicologaService.validarContratoAtivo(dto.psicologaId());

        Question question = buscarOuLancarExcecao(id);

        Trail trail = trailRepository.findById(dto.trilhaId())
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + dto.trilhaId()));

        Psychologist psicologa = psicologaRepository.findById(dto.psicologaId())
                .orElseThrow(() -> new EntityNotFoundException("Psicóloga não encontrada. ID: " + dto.psicologaId()));

        question.setContent(dto.enunciado());
        question.setQuestionType(dto.questionType());
        question.setTrail(trail);
        question.setPsychologist(psicologa);

        // Limpa opções antigas e reaplica
        question.getOptions().clear();
        if (question.acceptsOptions()) {
            validarOpcoes(dto.opcoes());
            adicionarOpcoes(question, dto.opcoes());
        }

        question = questionRepository.save(question);
        return new QuestionDTO(question);
    }

    @Transactional
    public void delete(Long id, Long psicologaId) {
        // Valida contrato antes de excluir
        psicologaService.validarContratoAtivo(psicologaId);

        if (!questionRepository.existsById(id)) {
            throw new EntityNotFoundException("Pergunta não encontrada. ID: " + id);
        }
        questionRepository.deleteById(id);
    }

    // --- Métodos auxiliares privados ---

    private Question buscarOuLancarExcecao(Long id) {
        return questionRepository.findById(id)
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
            opcao.setOptionText(opcaoDTO.textoOpcao());
            opcao.setHumanitiesWeight(opcaoDTO.pesoHumanas());
            opcao.setBiologicalSciencesWeight(opcaoDTO.pesoBiologicas());
            opcao.setExactSciencesWeight(opcaoDTO.pesoExatas());
            opcao.setArtsWeight(opcaoDTO.pesoArte());
            opcao.setQuestion(pergunta);
            pergunta.getOptions().add(opcao);
        }
    }
}
