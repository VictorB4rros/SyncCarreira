package com.synccarreira.synccarreira_api.dto;

import com.synccarreira.synccarreira_api.entities.Appointment;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleStatus;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleType;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public record AppointmentDTO(
        Long id,
        String title,
        String description,
        LocalDateTime dateTime,
        Integer durationMinutes,
        ScheduleType scheduleType,
        ScheduleStatus scheduleStatus,
        AppointmentParticipantDTO psychologist,
        List<AppointmentParticipantDTO> students,
        String googleEventId,
        String meetLink,
        String calendarLink,
        String feedback,
        LocalDateTime feedbackDate,
        String cancelReason
) {
    public AppointmentDTO(Appointment appointment) {
        this(
                appointment.getId(),
                appointment.getTitle(),
                appointment.getDescription(),
                appointment.getDateTime(),
                appointment.getDurationMinutes(),
                appointment.getScheduleType(),
                appointment.getScheduleStatus(),
                appointment.getPsychologist() != null ?
                        new AppointmentParticipantDTO(appointment.getPsychologist()) : null,
                appointment.getStudents().stream()
                        .map(AppointmentParticipantDTO::new)
                        .sorted(Comparator.comparing(AppointmentParticipantDTO::name))
                        .toList(),
                appointment.getGoogleEventId(),
                appointment.getMeetLink(),
                appointment.getCalendarLink(),
                appointment.getFeedback(),
                appointment.getFeedbackDate(),
                appointment.getCancelReason()
        );
    }
}
