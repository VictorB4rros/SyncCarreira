package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.PsychologistDTO;
import com.synccarreira.synccarreira_api.dto.PsychologistInsertDTO;
import com.synccarreira.synccarreira_api.dto.PsychologistUpdateDTO;
import com.synccarreira.synccarreira_api.dto.RoleDTO;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.repositories.RoleRepository;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import com.synccarreira.synccarreira_api.tests.PsychologistFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(MockitoExtension.class)
class PsychologistServiceTests {

    @InjectMocks
    private PsychologistService service;

    @Mock
    private PsychologistRepository psychologistRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RoleRepository roleRepository;

    private long existingId;
    private long nonExistingId;
    private Psychologist psychologist;
    private PsychologistInsertDTO insertDTO;
    private PsychologistUpdateDTO updateDTO;

    @BeforeEach
    void setUp() {
        existingId = 1L;
        nonExistingId = 100L;
        psychologist = PsychologistFactory.createPsychologist();
        insertDTO = PsychologistFactory.createPsychologistInsertDTO();
        updateDTO = PsychologistFactory.createPsychologistUpdateDTO();
    }

    private static List<String> authoritiesOf(PsychologistDTO dto) {
        return dto.roles().stream().map(RoleDTO::getAuthority).toList();
    }

    // ── create ──────────────────────────────────────────────────

    @Test
    void createShouldAssignPsychologistRoleByNameIgnoringRoleIdFromRequest() {
        Mockito.when(psychologistRepository.existsByNameAndCrp(anyString(), anyString())).thenReturn(false);
        Mockito.when(passwordEncoder.encode(anyString())).thenReturn("hash");
        Mockito.when(roleRepository.findByAuthority(PsychologistFactory.PSYCHOLOGIST_ROLE))
                .thenReturn(PsychologistFactory.createPsychologistRole());
        Mockito.when(psychologistRepository.save(any(Psychologist.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PsychologistDTO result = service.create(insertDTO);

        Assertions.assertEquals(List.of(PsychologistFactory.PSYCHOLOGIST_ROLE), authoritiesOf(result));
        Assertions.assertEquals(insertDTO.getEmail(), result.email());
        Mockito.verify(roleRepository, Mockito.never()).findById(anyLong());
    }

    @Test
    void createShouldEncodePassword() {
        Mockito.when(psychologistRepository.existsByNameAndCrp(anyString(), anyString())).thenReturn(false);
        Mockito.when(passwordEncoder.encode(insertDTO.getPassword())).thenReturn("hash");
        Mockito.when(roleRepository.findByAuthority(PsychologistFactory.PSYCHOLOGIST_ROLE))
                .thenReturn(PsychologistFactory.createPsychologistRole());
        Mockito.when(psychologistRepository.save(any(Psychologist.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.create(insertDTO);

        Mockito.verify(psychologistRepository).save(Mockito.argThat(p -> "hash".equals(p.getPassword())));
    }

    @Test
    void createShouldThrowIllegalStateExceptionAndNotSaveWhenPsychologistRoleIsMissing() {
        Mockito.when(psychologistRepository.existsByNameAndCrp(anyString(), anyString())).thenReturn(false);
        Mockito.when(passwordEncoder.encode(anyString())).thenReturn("hash");
        Mockito.when(roleRepository.findByAuthority(PsychologistFactory.PSYCHOLOGIST_ROLE)).thenReturn(null);

        Assertions.assertThrows(IllegalStateException.class, () -> service.create(insertDTO));

        Mockito.verify(psychologistRepository, Mockito.never()).save(any());
    }

    @Test
    void createShouldThrowIllegalArgumentExceptionWhenNameAndCrpAlreadyExist() {
        Mockito.when(psychologistRepository.existsByNameAndCrp(anyString(), anyString())).thenReturn(true);

        Assertions.assertThrows(IllegalArgumentException.class, () -> service.create(insertDTO));

        Mockito.verify(psychologistRepository, Mockito.never()).save(any());
    }

    // ── update ──────────────────────────────────────────────────

    @Test
    void updateShouldReplaceRolesWithPsychologistRole() {
        Mockito.when(psychologistRepository.findById(existingId)).thenReturn(Optional.of(psychologist));
        Mockito.when(roleRepository.findByAuthority(PsychologistFactory.PSYCHOLOGIST_ROLE))
                .thenReturn(PsychologistFactory.createPsychologistRole());
        Mockito.when(psychologistRepository.save(any(Psychologist.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PsychologistDTO result = service.update(existingId, updateDTO);

        Assertions.assertEquals(List.of(PsychologistFactory.PSYCHOLOGIST_ROLE), authoritiesOf(result));
        Assertions.assertEquals(updateDTO.getName(), result.name());
        Assertions.assertEquals(updateDTO.getCrp(), result.crp());
        Mockito.verify(roleRepository, Mockito.never()).findById(anyLong());
    }

    @Test
    void updateShouldThrowIllegalStateExceptionAndNotSaveWhenPsychologistRoleIsMissing() {
        Mockito.when(psychologistRepository.findById(existingId)).thenReturn(Optional.of(psychologist));
        Mockito.when(roleRepository.findByAuthority(PsychologistFactory.PSYCHOLOGIST_ROLE)).thenReturn(null);

        Assertions.assertThrows(IllegalStateException.class, () -> service.update(existingId, updateDTO));

        Mockito.verify(psychologistRepository, Mockito.never()).save(any());
    }

    @Test
    void updateShouldThrowResourceNotFoundExceptionWhenIdDoesNotExist() {
        Mockito.when(psychologistRepository.findById(nonExistingId)).thenReturn(Optional.empty());

        Assertions.assertThrows(ResourceNotFoundException.class, () -> service.update(nonExistingId, updateDTO));

        Mockito.verify(roleRepository, Mockito.never()).findByAuthority(anyString());
    }
}