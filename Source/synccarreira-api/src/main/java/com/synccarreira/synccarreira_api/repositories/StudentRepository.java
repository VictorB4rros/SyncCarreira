package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.dto.StudentDetailsDTO;
import com.synccarreira.synccarreira_api.entities.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @Query(value = "SELECT new com.synccarreira.synccarreira_api.dto.StudentDetailsDTO(obj.id, obj.name, obj.email, obj.scholarYear, obj.schoolType, obj.race, c.name, i.legalName) " +
            "FROM Student obj " +
            "LEFT JOIN obj.determinedSchoolClass c " +
            "LEFT JOIN c.institution i",
            countQuery = "SELECT count(obj) FROM Student obj")
    Page<StudentDetailsDTO> searchAllPaged(Pageable pageable);

    @Modifying
    @Query(nativeQuery = true, value = """
            UPDATE tb_aluno
            SET fk_id_turma = :classId
            WHERE id_usuario = :studentId""")
    void setSchoolClass(@Param("studentId") Long studentId, @Param("classId") Long classId);
}
