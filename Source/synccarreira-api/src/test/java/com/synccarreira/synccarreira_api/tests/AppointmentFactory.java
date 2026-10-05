package com.synccarreira.synccarreira_api.tests;

import com.synccarreira.synccarreira_api.dto.AppointmentCancelDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentFeedbackDTO;
import com.synccarreira.synccarreira_api.dto.AppointmentInsertDTO;
import com.synccarreira.synccarreira_api.entities.Appointment;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleStatus;
import com.synccarreira.synccarreira_api.entities.enums.ScheduleType;

import java.time.LocalDateTime;
import java.util.List;

public class AppointmentFactory {

    public static Appointment createAppointment() {
        Appointment appointment = new Appointment();
        appointment.setId(1L);
        appointment.setTitle("Conversa sobre a trilha Autoconhecimento");
        appointment.setDescription("Traga suas dúvidas sobre as áreas de interesse.");
        appointment.setDateTime(LocalDateTime.now().plusDays(2));
        appointment.setDurationMinutes(50);
        appointment.setScheduleType(ScheduleType.INDIVIDUAL);
        appointment.setScheduleStatus(ScheduleStatus.AGENDADA);
        appointment.setPsychologist(PsychologistFactory.createPsychologist());
        appointment.getStudents().add(StudentFactory.createStudent());
        appointment.setGoogleEventId("7l3k2j1h0g9f8e7d6c5b4a");
        appointment.setMeetLink("https://meet.google.com/abc-defg-hij");
        appointment.setCalendarLink("https://www.google.com/calendar/event?eid=abc");
        return appointment;
    }

    public static Appointment createAppointmentWithStatus(ScheduleStatus status) {
        Appointment appointment = createAppointment();
        appointment.setScheduleStatus(status);
        return appointment;
    }

    public static Student createSecondStudent() {
        Student student = StudentFactory.createStudent();
        student.setId(2L);
        student.setName("Bruno Lima");
        student.setEmail("bruno.lima@gmail.com");
        return student;
    }

    public static AppointmentInsertDTO createAppointmentInsertDTO(ScheduleType scheduleType, List<Long> studentIds) {
        return new AppointmentInsertDTO(
                "Conversa sobre a trilha Autoconhecimento",
                "Traga suas dúvidas.",
                LocalDateTime.now().plusDays(2),
                50,
                scheduleType,
                1L,
                studentIds,
                "7l3k2j1h0g9f8e7d6c5b4a",
                "https://meet.google.com/abc-defg-hij",
                "https://www.google.com/calendar/event?eid=abc"
        );
    }

    public static AppointmentInsertDTO createIndividualAppointmentInsertDTO() {
        return createAppointmentInsertDTO(ScheduleType.INDIVIDUAL, List.of(1L));
    }

    public static AppointmentInsertDTO createGroupAppointmentInsertDTO() {
        return createAppointmentInsertDTO(ScheduleType.GRUPO, List.of(1L, 2L));
    }

    public static AppointmentDTO createAppointmentDTO() {
        return new AppointmentDTO(createAppointment());
    }

    public static AppointmentDTO createAppointmentDTOWithStatus(ScheduleStatus status) {
        return new AppointmentDTO(createAppointmentWithStatus(status));
    }

    public static AppointmentInsertDTO createInvalidAppointmentInsertDTO() {
        return new AppointmentInsertDTO(
                "",
                null,
                LocalDateTime.now().minusDays(1),
                0,
                null,
                null,
                List.of(),
                null,
                null,
                null
        );
    }

    public static AppointmentCancelDTO createAppointmentCancelDTO() {
        return new AppointmentCancelDTO("Aluno não poderá comparecer.");
    }

    public static AppointmentCancelDTO createInvalidAppointmentCancelDTO() {
        return new AppointmentCancelDTO("");
    }

    public static AppointmentFeedbackDTO createAppointmentFeedbackDTO() {
        return new AppointmentFeedbackDTO("Aluno demonstrou interesse pela área de exatas.");
    }

    public static AppointmentFeedbackDTO createInvalidAppointmentFeedbackDTO() {
        return new AppointmentFeedbackDTO("");
    }
}
