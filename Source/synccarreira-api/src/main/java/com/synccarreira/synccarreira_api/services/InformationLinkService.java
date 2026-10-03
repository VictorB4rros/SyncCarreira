package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.InformationLinkDTO;
import com.synccarreira.synccarreira_api.dto.InformationTrailDTO;
import com.synccarreira.synccarreira_api.dto.StudentScoreDTO;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.entities.Trail;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;
import com.synccarreira.synccarreira_api.repositories.InformationLinkRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.repositories.TrailRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ForbiddenException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InformationLinkService {

    private final InformationLinkRepository informationLinkRepository;

    private final StudentRepository studentRepository;

    private final TrailRepository trailRepository;

    private final TrailService trailService;

    private final AuthService authService;

    public InformationLinkService(
            final InformationLinkRepository informationLinkRepository,
            final StudentRepository studentRepository,
            final TrailRepository trailRepository,
            final TrailService trailService,
            final AuthService authService) {
        this.informationLinkRepository = informationLinkRepository;
        this.studentRepository = studentRepository;
        this.trailRepository = trailRepository;
        this.trailService = trailService;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public InformationTrailDTO findForLoggedStudent() {
        User user = authService.authenticated();
        Student student = studentRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado. ID: " + user.getId()));
        validateInformationTrailAccess();

        List<KnowledgeArea> recommendedAreas = student.highestScoreAreas();
        List<InformationLinkDTO> careerLinks = informationLinkRepository.findByKnowledgeAreaInOrderByTopicAscIdAsc(recommendedAreas)
                .stream()
                .map(InformationLinkDTO::new)
                .toList();
        List<InformationLinkDTO> universityAccessLinks = informationLinkRepository.findByKnowledgeAreaIsNullOrderByTopicAscIdAsc()
                .stream()
                .map(InformationLinkDTO::new)
                .toList();

        return new InformationTrailDTO(recommendedAreas, new StudentScoreDTO(student), careerLinks, universityAccessLinks);
    }

    private void validateInformationTrailAccess() {
        Trail informationTrail = trailRepository.findByName(TrailName.INFORMACAO)
                .orElseThrow(() -> new ResourceNotFoundException("Trilha de informação não encontrada."));
        if (!trailService.canAccess(informationTrail.getId())) {
            throw new ForbiddenException("Acesso negado: conclua as trilhas anteriores para acessar a trilha de informação.");
        }
    }
}
