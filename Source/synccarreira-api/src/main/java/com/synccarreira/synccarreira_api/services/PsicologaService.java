package com.synccarreira.synccarreira_api.service;

import com.synccarreira.synccarreira_api.dto.PsicologaDTO;
import com.synccarreira.synccarreira_api.entities.Psicologa;
import com.synccarreira.synccarreira_api.repository.PsicologaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PsicologaService {

    @Autowired
    private PsicologaRepository psicologaRepository;

    @Transactional(readOnly = true)
    public List<PsicologaDTO> findAll() {
        return psicologaRepository.findAll()
                .stream()
                .map(PsicologaDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public PsicologaDTO findById(Long id) {
        Psicologa psicologa = buscarOuLancarExcecao(id);
        return new PsicologaDTO(psicologa);
    }

    @Transactional
    public PsicologaDTO create(PsicologaDTO dto) {
        if (psicologaRepository.existsByNomePsicologaAndCrp(dto.nomePsicologa(), dto.crp())) {
            throw new IllegalArgumentException(
                    "Já existe uma psicóloga cadastrada com o nome '" + dto.nomePsicologa() +
                    "' e CRP '" + dto.crp() + "'.");
        }

        Psicologa psicologa = new Psicologa();
        psicologa.setNomePsicologa(dto.nomePsicologa());
        psicologa.setEmail(dto.email());
        psicologa.setCrp(dto.crp());
        psicologa.setDataVencContrato(dto.dataVencContrato());

        psicologa = psicologaRepository.save(psicologa);
        return new PsicologaDTO(psicologa);
    }

    @Transactional
    public PsicologaDTO update(Long id, PsicologaDTO dto) {
        Psicologa psicologa = buscarOuLancarExcecao(id);
        psicologa.setNomePsicologa(dto.nomePsicologa());
        psicologa.setEmail(dto.email());
        psicologa.setCrp(dto.crp());
        psicologa.setDataVencContrato(dto.dataVencContrato());
        psicologa = psicologaRepository.save(psicologa);
        return new PsicologaDTO(psicologa);
    }

    @Transactional
    public void delete(Long id) {
        if (!psicologaRepository.existsById(id)) {
            throw new EntityNotFoundException("Psicóloga não encontrada. ID: " + id);
        }
        psicologaRepository.deleteById(id);
    }

    /**
     * Valida se a psicóloga pode realizar operações restritas
     * (cadastrar/editar/excluir perguntas e realizar agendamentos).
     * Lança exceção se o contrato estiver vencido.
     */
    public void validarContratoAtivo(Long psicologaId) {
        Psicologa psicologa = buscarOuLancarExcecao(psicologaId);
        if (!psicologa.isContratoValido()) {
            throw new IllegalStateException(
                    "Operação bloqueada: o contrato da psicóloga '" +
                    psicologa.getNomePsicologa() + "' está vencido desde " +
                    psicologa.getDataVencContrato() + ".");
        }
    }

    // Método auxiliar reutilizável internamente
    private Psicologa buscarOuLancarExcecao(Long id) {
        return psicologaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Psicóloga não encontrada. ID: " + id));
    }
}
