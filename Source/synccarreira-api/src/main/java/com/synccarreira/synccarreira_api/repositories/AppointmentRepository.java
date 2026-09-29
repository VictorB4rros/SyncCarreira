package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.Appointment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @EntityGraph(attributePaths = {"psychologist", "students"})
    List<Appointment> findByPsychologistIdOrderByDateTimeAsc(Long psychologistId);

    @EntityGraph(attributePaths = {"psychologist", "students"})
    @Query("SELECT a FROM Appointment a " +
            "WHERE EXISTS (SELECT 1 FROM Appointment a2 JOIN a2.students s WHERE a2 = a AND s.id = :studentId) " +
            "ORDER BY a.dateTime ASC")
    List<Appointment> findByStudentId(@Param("studentId") Long studentId);
}
