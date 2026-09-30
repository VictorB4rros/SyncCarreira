package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.psychologist.PanelDTOs;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.repositories.TrailRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PsychologistPanelService {

    private final TrailRepository trailRepository;

    private final PsychologistRepository psychologistRepository;

    private final StudentRepository studentRepository;

    public PsychologistPanelService(
            final TrailRepository trailRepository,
            final PsychologistRepository psychologistRepository,
            final StudentRepository studentRepository) {
        this.trailRepository = trailRepository;
        this.psychologistRepository = psychologistRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public PanelDTOs.PanelSummary panel(Long psychologistId, Boolean onlyInDoubt) {
        long totalTrails = trailRepository.count();
        List<Student> students = studentsInScope(psychologistId);

        Map<Long, Boolean> openAlertByStudent = new HashMap<>();

    }

    public List<Student> studentsInScope(Long psychologistId) {
        Psychologist psychologist = psychologistRepository.findById(psychologistId).orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado na base de dados."));
        return studentRepository.findByDeterminedSchoolClassInstitutionId(psychologist.getInstitution().getId());
    }
}
