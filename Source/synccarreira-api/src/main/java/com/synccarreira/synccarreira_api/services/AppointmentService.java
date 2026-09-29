package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.AppointmentCancelDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentFeedbackDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentInsertDTO;
import com.synccarreira.synccarreira_api.entities.Appointment;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleStatus;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleType;
import com.synccarreira.synccarreira_api.repositories.AppointmentRepository;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.repositories.StudentRepository;
import com.synccarreira.synccarreira_api.services.exceptions.BusinessException;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    private final PsychologistRepository psychologistRepository;

    private final StudentRepository studentRepository;

    private final PsychologistService psychologistService;

    public AppointmentService(
            final AppointmentRepository appointmentRepository,
            final PsychologistRepository psychologistRepository,
            final StudentRepository studentRepository,
            final PsychologistService psychologistService) {
        this.appointmentRepository = appointmentRepository;
        this.psychologistRepository = psychologistRepository;
        this.studentRepository = studentRepository;
        this.psychologistService = psychologistService;
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findByPsychologist(Long psychologistId) {
        return appointmentRepository.findByPsychologistIdOrderByDateTimeAsc(psychologistId)
                .stream()
                .map(AppointmentDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> findByStudent(Long studentId) {
        return appointmentRepository.findByStudentId(studentId)
                .stream()
                .map(AppointmentDTO::new)
                .toList();
    }

    @Transactional
    public AppointmentDTO insert(AppointmentInsertDTO dto) {
        Appointment appointment = new Appointment();
        copyDtoToEntity(dto, appointment);
        appointment.setScheduleStatus(ScheduleStatus.AGENDADA);
        appointment = appointmentRepository.save(appointment);
        return new AppointmentDTO(appointment);
    }

    @Transactional
    public AppointmentDTO update(Long id, AppointmentInsertDTO dto) {
        Appointment appointment = findEntityById(id);
        if (appointment.getScheduleStatus() != ScheduleStatus.AGENDADA) {
            throw new IllegalStateException(
                    "Apenas sessões agendadas podem ser editadas. Status atual: " + appointment.getScheduleStatus() + ".");
        }
        copyDtoToEntity(dto, appointment);
        appointment = appointmentRepository.save(appointment);
        return new AppointmentDTO(appointment);
    }

    @Transactional
    public AppointmentDTO cancel(Long id, AppointmentCancelDTO dto) {
        Appointment appointment = findEntityById(id);
        if (appointment.getScheduleStatus() != ScheduleStatus.AGENDADA) {
            throw new IllegalStateException(
                    "Apenas sessões agendadas podem ser canceladas. Status atual: " + appointment.getScheduleStatus() + ".");
        }
        appointment.setScheduleStatus(ScheduleStatus.CANCELADA);
        appointment.setCancelReason(dto.cancelReason());
        appointment = appointmentRepository.save(appointment);
        return new AppointmentDTO(appointment);
    }

    @Transactional
    public AppointmentDTO registerFeedback(Long id, AppointmentFeedbackDTO dto) {
        Appointment appointment = findEntityById(id);
        if (appointment.getScheduleStatus() == ScheduleStatus.CANCELADA) {
            throw new IllegalStateException("Não é possível registrar feedback de uma sessão cancelada.");
        }
        appointment.setScheduleStatus(ScheduleStatus.REALIZADA);
        appointment.setFeedback(dto.feedback());
        appointment.setFeedbackDate(LocalDateTime.now());
        appointment = appointmentRepository.save(appointment);
        return new AppointmentDTO(appointment);
    }

    private Appointment findEntityById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento não encontrado. ID: " + id));
    }

    private void copyDtoToEntity(AppointmentInsertDTO dto, Appointment entity) {
        Set<Long> studentIds = new LinkedHashSet<>(dto.studentIds());
        validateStudentCount(dto.scheduleType(), studentIds.size());

        psychologistService.validateIfContractIsActive(dto.psychologistId());
        Psychologist psychologist = psychologistRepository.findById(dto.psychologistId())
                .orElseThrow(() -> new ResourceNotFoundException("Psicóloga não encontrada. ID: " + dto.psychologistId()));

        List<Student> students = studentRepository.findAllById(studentIds);
        if (students.size() != studentIds.size()) {
            List<Long> foundIds = students.stream().map(Student::getId).toList();
            List<Long> missingIds = studentIds.stream().filter(studentId -> !foundIds.contains(studentId)).toList();
            throw new ResourceNotFoundException("Aluno(s) não encontrado(s). ID(s): " + missingIds);
        }

        entity.setTitle(dto.title());
        entity.setDescription(dto.description());
        entity.setDateTime(dto.dateTime());
        entity.setDurationMinutes(dto.durationMinutes());
        entity.setScheduleType(dto.scheduleType());
        entity.setPsychologist(psychologist);
        entity.getStudents().clear();
        entity.getStudents().addAll(students);
        entity.setGoogleEventId(dto.googleEventId());
        entity.setMeetLink(dto.meetLink());
        entity.setCalendarLink(dto.calendarLink());
    }

    private void validateStudentCount(ScheduleType scheduleType, int count) {
        if (scheduleType == ScheduleType.INDIVIDUAL && count != 1) {
            throw new BusinessException("Sessões individuais devem ter exatamente 1 aluno.");
        }
        if (scheduleType == ScheduleType.GRUPO && count < 2) {
            throw new BusinessException("Sessões em grupo devem ter 2 ou mais alunos.");
        }
    }
}
