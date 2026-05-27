package com.synccarreira.synccarreira_api.service;

import com.synccarreira.synccarreira_api.dto.TrilhaDTO;
import com.synccarreira.synccarreira_api.entities.Trilha;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TrilhaService {

    @Autowired
    private com.synccarreira.synccarreira_api.repository.TrailRepository trailRepository;

    @Transactional(readOnly = true)
    public List<TrilhaDTO> findAll() {
        return trailRepository.findAll()
                .stream()
                .map(TrilhaDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrilhaDTO findById(Long id) {
        Trilha trilha = trailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + id));
        return new TrilhaDTO(trilha);
    }

    @Transactional
    public TrilhaDTO create(TrilhaDTO dto) {
        Trilha trilha = new Trilha();
        trilha.setNome(dto.nome());
        trilha.setOrdemSequencial(dto.ordemSequencial());
        trilha = trailRepository.save(trilha);
        return new TrilhaDTO(trilha);
    }

    @Transactional
    public TrilhaDTO update(Long id, TrilhaDTO dto) {
        Trilha trilha = trailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + id));
        trilha.setNome(dto.nome());
        trilha.setOrdemSequencial(dto.ordemSequencial());
        trilha = trailRepository.save(trilha);
        return new TrilhaDTO(trilha);
    }

    @Transactional
    public void delete(Long id) {
        if (!trailRepository.existsById(id)) {
            throw new EntityNotFoundException("Trilha não encontrada. ID: " + id);
        }
        trailRepository.deleteById(id);
    }

    /**
     * Verifica se o aluno pode acessar uma trilha com base na ordem sequencial.
     * A trilha de ordem 1 é sempre liberada.
     * As demais exigem que a trilha anterior esteja concluída (todas as perguntas respondidas).
     *
     * @param trilhaId       ID da trilha que o aluno quer acessar
     * @param idsRespondidos IDs das perguntas já respondidas pelo aluno
     */
    @Transactional(readOnly = true)
    public boolean podeAcessar(Long trilhaId, List<Long> idsRespondidos) {
        Trilha trilha = trailRepository.findById(trilhaId)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + trilhaId));

        // Trilha de ordem 1 sempre liberada
        if (trilha.getOrdemSequencial() == 1) {
            return true;
        }

        // Busca a trilha anterior
        int ordemAnterior = trilha.getOrdemSequencial() - 1;
        Trilha trilhaAnterior = trailRepository.findByOrdemSequencial(ordemAnterior)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Trilha anterior (ordem " + ordemAnterior + ") não encontrada."));

        return trilhaAnterior.isConcluida(idsRespondidos);
    }
}
