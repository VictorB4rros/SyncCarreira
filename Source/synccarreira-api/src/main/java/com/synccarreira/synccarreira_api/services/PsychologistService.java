package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.PsychologistDTO;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PsychologistService {

    @Autowired
    private PsychologistRepository psychologistRepository;

    @Transactional(readOnly = true)
    public List<PsychologistDTO> findAll() {
        return psychologistRepository.findAll()
                .stream()
                .map(PsychologistDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public PsychologistDTO findById(Long id) {
        Psychologist psychologist = psychologistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found."));
        return new PsychologistDTO(psychologist);
    }

    @Transactional
    public PsychologistDTO create(PsychologistDTO dto) {
        if (psychologistRepository.existsByNameAndCrp(dto.name(), dto.crp())) {
            throw new IllegalArgumentException(
                    "Já existe uma psicóloga cadastrada com o nome '" + dto.name() +
                    "' e CRP '" + dto.crp() + "'.");
        }

        Psychologist psychologist = new Psychologist();
        psychologist.setName(dto.name());
        psychologist.setEmail(dto.email());
        psychologist.setCrp(dto.crp());
        psychologist.setContractExpirationDate(dto.contractExpirationDate());

        psychologist = psychologistRepository.save(psychologist);
        return new PsychologistDTO(psychologist);
    }

    @Transactional
    public PsychologistDTO update(Long id, PsychologistDTO dto) {
        Psychologist psychologist = psychologistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found."));
        psychologist.setName(dto.name());
        psychologist.setEmail(dto.email());
        psychologist.setCrp(dto.crp());
        psychologist.setContractExpirationDate(dto.contractExpirationDate());
        psychologist = psychologistRepository.save(psychologist);
        return new PsychologistDTO(psychologist);
    }

    @Transactional
    public void delete(Long id) {
        if (!psychologistRepository.existsById(id)) {
            throw new EntityNotFoundException("Psicóloga não encontrada. ID: " + id);
        }
        psychologistRepository.deleteById(id);
    }

    public void validateIfContractIsActive(Long id) {
        Psychologist psychologist = psychologistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found."));
        if (!psychologist.isContractValid()) {
            throw new IllegalStateException(
                    "Operação bloqueada: o contrato da psicóloga '" +
                            psychologist.getName() + "' está vencido desde " +
                            psychologist.getContractExpirationDate() + ".");
        }
    }
}
