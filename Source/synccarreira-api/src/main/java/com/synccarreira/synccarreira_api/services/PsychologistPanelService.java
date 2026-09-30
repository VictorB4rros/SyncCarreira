package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.psychologist.PanelDTOs;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Trail;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.entities.enums.ProgressStatus;
import com.synccarreira.synccarreira_api.entities.enums.TrailName;
import com.synccarreira.synccarreira_api.projections.AnsweredQuestionsProjection;
import com.synccarreira.synccarreira_api.projections.PanelStudentProjection;
import com.synccarreira.synccarreira_api.projections.TrailQuestionCountProjection;
import com.synccarreira.synccarreira_api.repositories.AnswerRepository;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.repositories.QuestionRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.repositories.TrailRepository;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ForbiddenException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PsychologistPanelService {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final PsychologistRepository psychologistRepository;

    private final StudentRepository studentRepository;

    private final TrailRepository trailRepository;

    private final QuestionRepository questionRepository;

    private final AnswerRepository answerRepository;

    private final AuthService authService;

    public PsychologistPanelService(
            final PsychologistRepository psychologistRepository,
            final StudentRepository studentRepository,
            final TrailRepository trailRepository,
            final QuestionRepository questionRepository,
            final AnswerRepository answerRepository,
            final AuthService authService) {
        this.psychologistRepository = psychologistRepository;
        this.studentRepository = studentRepository;
        this.trailRepository = trailRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public PanelDTOs.PanelSummary findPanel(Long psychologistId) {
        validateSelfAccess(psychologistId);
        Long institutionId = findInstitutionId(psychologistId);

        List<Trail> trails = trailRepository.findAllByOrderBySequentialOrderAsc()
                .stream()
                .filter(trail -> trail.getName() != TrailName.INFORMACAO)
                .toList();
        Map<Long, Long> totalQuestionsByTrail = questionRepository.countQuestionsByTrail()
                .stream()
                .collect(Collectors.toMap(TrailQuestionCountProjection::trailId, TrailQuestionCountProjection::totalQuestions));
        Map<Long, Map<Long, Long>> answeredQuestionsByStudent = answerRepository.countAnsweredQuestionsByInstitution(institutionId)
                .stream()
                .collect(Collectors.groupingBy(
                        AnsweredQuestionsProjection::studentId,
                        Collectors.toMap(AnsweredQuestionsProjection::trailId, AnsweredQuestionsProjection::answeredQuestions)));

        List<PanelDTOs.StudentStatus> students = studentRepository.searchPanelStudentsByInstitution(institutionId)
                .stream()
                .map(student -> buildStudentStatus(
                        student,
                        trails,
                        totalQuestionsByTrail,
                        answeredQuestionsByStudent.getOrDefault(student.studentId(), Map.of())))
                .toList();

        return new PanelDTOs.PanelSummary(
                students.size(),
                countByJourneyStatus(students, ProgressStatus.NAO_INICIADA),
                countByJourneyStatus(students, ProgressStatus.EM_ANDAMENTO),
                countByJourneyStatus(students, ProgressStatus.CONCLUIDA),
                students);
    }

    private PanelDTOs.StudentStatus buildStudentStatus(
            PanelStudentProjection student,
            List<Trail> trails,
            Map<Long, Long> totalQuestionsByTrail,
            Map<Long, Long> answeredQuestionsByTrail) {
        List<PanelDTOs.TrailProgress> trailProgressList = new ArrayList<>();
        long answeredQuestions = 0;
        long totalQuestions = 0;
        int concludedTrails = 0;
        Trail currentTrail = null;

        for (Trail trail : trails) {
            long trailTotal = totalQuestionsByTrail.getOrDefault(trail.getId(), 0L);
            long trailAnswered = answeredQuestionsByTrail.getOrDefault(trail.getId(), 0L);
            ProgressStatus status = trailStatus(trailAnswered, trailTotal);

            trailProgressList.add(new PanelDTOs.TrailProgress(
                    trail.getId(),
                    trail.getName(),
                    trail.getSequentialOrder(),
                    trailAnswered,
                    trailTotal,
                    percentage(trailAnswered, trailTotal),
                    status));

            answeredQuestions += trailAnswered;
            totalQuestions += trailTotal;
            if (status == ProgressStatus.CONCLUIDA) {
                concludedTrails++;
            } else if (currentTrail == null) {
                currentTrail = trail;
            }
        }

        return new PanelDTOs.StudentStatus(
                student.studentId(),
                student.studentName(),
                student.schoolClassId(),
                student.schoolClassName(),
                answeredQuestions,
                totalQuestions,
                percentage(answeredQuestions, totalQuestions),
                concludedTrails,
                trails.size(),
                currentTrail != null ? currentTrail.getName() : null,
                journeyStatus(answeredQuestions, concludedTrails, trails.size()),
                trailProgressList);
    }

    private static ProgressStatus trailStatus(long answered, long total) {
        if (total > 0 && answered >= total) {
            return ProgressStatus.CONCLUIDA;
        }
        return answered > 0 ? ProgressStatus.EM_ANDAMENTO : ProgressStatus.NAO_INICIADA;
    }

    private static ProgressStatus journeyStatus(long answeredQuestions, int concludedTrails, int totalTrails) {
        if (totalTrails > 0 && concludedTrails == totalTrails) {
            return ProgressStatus.CONCLUIDA;
        }
        return answeredQuestions > 0 ? ProgressStatus.EM_ANDAMENTO : ProgressStatus.NAO_INICIADA;
    }

    private static int percentage(long answered, long total) {
        if (total == 0) {
            return 0;
        }
        return (int) (Math.min(answered, total) * 100 / total);
    }

    private static int countByJourneyStatus(List<PanelDTOs.StudentStatus> students, ProgressStatus status) {
        return (int) students.stream().filter(student -> student.journeyStatus() == status).count();
    }

    private Long findInstitutionId(Long psychologistId) {
        Psychologist psychologist = psychologistRepository.findById(psychologistId)
                .orElseThrow(() -> new ResourceNotFoundException("Psicóloga não encontrada. ID: " + psychologistId));
        if (psychologist.getInstitution() == null) {
            throw new BusinessException("A psicóloga não está vinculada a nenhuma instituição.");
        }
        return psychologist.getInstitution().getId();
    }

    private void validateSelfAccess(Long psychologistId) {
        User user = authService.authenticated();
        if (user.hasRole(ROLE_ADMIN)) {
            return;
        }
        if (!user.getId().equals(psychologistId)) {
            throw new ForbiddenException("Acesso negado: só é permitido acessar o próprio painel.");
        }
    }
}
