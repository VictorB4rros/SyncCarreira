package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.SchoolClassDTO;
import com.synccarreira.synccarreira_api.dto.SchoolClassInsertDTO;
import com.synccarreira.synccarreira_api.dto.SchoolClassUpdateDTO;
import com.synccarreira.synccarreira_api.entities.Institution;
import com.synccarreira.synccarreira_api.entities.SchoolClass;
import com.synccarreira.synccarreira_api.repositories.InstitutionRepository;
import com.synccarreira.synccarreira_api.repositories.SchoolClassRepository;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SchoolClassService {

    private final SchoolClassRepository schoolClassRepository;

    private final InstitutionRepository institutionRepository;

    private final UserRepository userRepository;

    public SchoolClassService(final SchoolClassRepository schoolClassRepository, final InstitutionRepository institutionRepository, final UserRepository userRepository) {
        this.schoolClassRepository = schoolClassRepository;
        this.institutionRepository = institutionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<SchoolClassDTO> findAll() {
        return schoolClassRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(SchoolClassDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SchoolClassDTO> findByInstitutionId(Long institutionId) {
        return schoolClassRepository.findByInstitutionId(institutionId).stream()
                .map(SchoolClassDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public SchoolClassDTO findById(Long id) {
        return new SchoolClassDTO(getOrThrow(id));
    }

    @Transactional
    public SchoolClassDTO create(SchoolClassInsertDTO dto) {
        Institution institution = institutionRepository.findById(dto.institutionId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Instituição não encontrada. ID: " + dto.institutionId()));
        if (!Boolean.TRUE.equals(institution.getActive())) {
            throw new BusinessException("Não é possível criar turma em instituição desativada.");
        }

        SchoolClass entity = new SchoolClass();
        entity.setName(dto.name().trim());
        entity.setSchoolYear(dto.schoolYear());
        entity.setInstitution(institution);
        return new SchoolClassDTO(schoolClassRepository.save(entity));
    }

    @Transactional
    public SchoolClassDTO update(Long id, SchoolClassUpdateDTO dto) {
        SchoolClass entity = getOrThrow(id);
        entity.setName(dto.name().trim());
        entity.setSchoolYear(dto.schoolYear());
        return new SchoolClassDTO(schoolClassRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        SchoolClass entity = getOrThrow(id);
        schoolClassRepository.delete(entity);
    }

    private SchoolClass getOrThrow(Long id) {
        return schoolClassRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turma não encontrada. ID: " + id));
    }
}
