package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.TrailDTO;
import com.synccarreira.synccarreira_api.entities.Trail;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TrilhaService {

    @Autowired
    private com.synccarreira.synccarreira_api.repositories.TrailRepository trailRepository;

    @Transactional(readOnly = true)
    public List<TrailDTO> findAll() {
        return trailRepository.findAll()
                .stream()
                .map(TrailDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrailDTO findById(Long id) {
        Trail trilha = trailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + id));
        return new TrailDTO(trilha);
    }

    @Transactional
    public TrailDTO create(TrailDTO dto) {
        Trail trail = new Trail();
        trail.setName(dto.name());
        trail.setSequentialOrder(dto.sequentialOrder());
        trail = trailRepository.save(trail);
        return new TrailDTO(trail);
    }

    @Transactional
    public TrailDTO update(Long id, TrailDTO dto) {
        Trail trail = trailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + id));
        trail.setName(dto.name());
        trail.setSequentialOrder(dto.sequentialOrder());
        trail = trailRepository.save(trail);
        return new TrailDTO(trail);
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
        Trail trail = trailRepository.findById(trilhaId)
                .orElseThrow(() -> new EntityNotFoundException("Trilha não encontrada. ID: " + trilhaId));

        // Trilha de ordem 1 sempre liberada
        if (trail.getSequentialOrder() == 1) {
            return true;
        }

        // Busca a trilha anterior
        int ordemAnterior = trail.getSequentialOrder() - 1;
        Trail trilhaAnterior = trailRepository.findBySequentialOrder(ordemAnterior)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Trilha anterior (ordem " + ordemAnterior + ") não encontrada."));

        return trilhaAnterior.isConcluded(idsRespondidos);
    }
}
