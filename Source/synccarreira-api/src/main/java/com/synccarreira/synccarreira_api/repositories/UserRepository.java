package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.projections.UserDetailsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

	User findByEmail(String email);

	@Query(nativeQuery = true, value = """
				SELECT tb_usuario.email_usuario AS username, tb_usuario.senha_usuario AS password, tb_role.pk_role AS roleId, tb_role.autoridade_role AS authority
				FROM tb_usuario
				INNER JOIN tb_usuario_role ON tb_usuario.pk_usuario = tb_usuario_role.pk_usuario
				INNER JOIN tb_role ON tb_role.pk_role = tb_usuario_role.pk_role
				WHERE tb_usuario.email_usuario = :email
			""")
	List<UserDetailsProjection> searchUserAndRolesByEmail(String email);
}
