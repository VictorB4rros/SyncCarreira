package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.dto.StudentDetailsDTO;
import com.synccarreira.synccarreira_api.entities.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StudentRepository extends JpaRepository<Student, Long> {

    @Query(value = "SELECT new com.synccarreira.synccarreira_api.dto.StudentDetailsDTO(obj.id, obj.name, obj.email, obj.schollarYear, obj.schoolType, obj.race, c.name, i.name) " +
            "FROM Student obj " +
            "LEFT JOIN obj.determinedClass c " +
            "LEFT JOIN c.institution i",
            countQuery = "SELECT count(obj) FROM Student obj")
    Page<StudentDetailsDTO> searchAllPaged(Pageable pageable);
}
