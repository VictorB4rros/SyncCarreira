package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.UserDTO;
import com.synccarreira.synccarreira_api.entities.User;
import com.synccarreira.synccarreira_api.projections.UserDetailsProjection;
import com.synccarreira.synccarreira_api.repositories.RoleRepository;
import com.synccarreira.synccarreira_api.repositories.UserRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@ExtendWith(MockitoExtension.class)
class UserServiceTests {

    @InjectMocks
    private UserService service;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserRepository repository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AuthService authService;

    private String existingEmail;
    private String nonExistingEmail;
    private User user;

    @BeforeEach
    void setUp() {
        existingEmail = "ana.souza@gmail.com";
        nonExistingEmail = "naoexiste@gmail.com";

        user = new User();
        user.setId(1L);
        user.setName("Ana Souza");
        user.setEmail(existingEmail);
    }

    @Test
    void findAllShouldReturnPageOfUserDTO() {
        Pageable pageable = PageRequest.of(0, 10);
        Mockito.when(repository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(user), pageable, 1));

        Page<UserDTO> result = service.findAll(pageable);

        Assertions.assertEquals(1, result.getTotalElements());
        Assertions.assertEquals(user.getId(), result.getContent().get(0).getId());
        Assertions.assertEquals(existingEmail, result.getContent().get(0).getEmail());
    }

    @Test
    void loadUserByUsernameShouldReturnUserWithRolesWhenEmailExists() {
        UserDetailsProjection projection = Mockito.mock(UserDetailsProjection.class);
        Mockito.when(projection.getUsername()).thenReturn(existingEmail);
        Mockito.when(projection.getPassword()).thenReturn("senhaCriptografada");
        Mockito.when(projection.getRoleId()).thenReturn(1L);
        Mockito.when(projection.getAuthority()).thenReturn("ROLE_USER");
        Mockito.when(repository.searchUserAndRolesByEmail(existingEmail)).thenReturn(List.of(projection));

        UserDetails result = service.loadUserByUsername(existingEmail);

        Assertions.assertEquals(existingEmail, result.getUsername());
        Assertions.assertEquals("senhaCriptografada", result.getPassword());
        Assertions.assertTrue(result.getAuthorities().stream().anyMatch(a -> "ROLE_USER".equals(a.getAuthority())));
    }

    @Test
    void loadUserByUsernameShouldThrowUsernameNotFoundExceptionWhenEmailDoesNotExist() {
        Mockito.when(repository.searchUserAndRolesByEmail(nonExistingEmail)).thenReturn(List.of());

        Assertions.assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername(nonExistingEmail));
    }
}
