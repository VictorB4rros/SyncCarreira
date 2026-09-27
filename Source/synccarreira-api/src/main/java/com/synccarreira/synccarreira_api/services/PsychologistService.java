package com.synccarreira.synccarreira_api.services;

import com.synccarreira.synccarreira_api.dto.PsychologistDTO;
import com.synccarreira.synccarreira_api.dto.PsychologistInsertDTO;
import com.synccarreira.synccarreira_api.dto.PsychologistUpdateDTO;
import com.synccarreira.synccarreira_api.dto.StudentInsertDTO;
import com.synccarreira.synccarreira_api.entities.PasswordRecover;
import com.synccarreira.synccarreira_api.entities.Psychologist;
import com.synccarreira.synccarreira_api.entities.Role;
import com.synccarreira.synccarreira_api.entities.Student;
import com.synccarreira.synccarreira_api.repositories.PasswordRecoverRepository;
import com.synccarreira.synccarreira_api.repositories.PsychologistRepository;
import com.synccarreira.synccarreira_api.repositories.RoleRepository;
import com.synccarreira.synccarreira_api.services.events.EmailEvent;
import com.synccarreira.synccarreira_api.services.exceptions.ResourceNotFoundException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class PsychologistService {

    @Value("${email.password-recover.token.minutes}")
    private Long tokenMinutes;

    @Value("${email.password-recover.uri}")
    private String recoverUri;

    private final PsychologistRepository psychologistRepository;

    private final PasswordEncoder passwordEncoder;

    private final RoleRepository roleRepository;

    private final PasswordRecoverRepository passwordRecoverRepository;

    private final ApplicationEventPublisher eventPublisher;

    public PsychologistService(
            final PsychologistRepository psychologistRepository,
            final PasswordEncoder passwordEncoder,
            final RoleRepository roleRepository,
            final PasswordRecoverRepository passwordRecoverRepository,
            final ApplicationEventPublisher eventPublisher) {
        this.psychologistRepository = psychologistRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.passwordRecoverRepository = passwordRecoverRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<PsychologistDTO> findAll() {
        return psychologistRepository.findAll()
                .stream()
                .map(PsychologistDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public PsychologistDTO findById(Long id) {
        Psychologist psychologist = psychologistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found."));
        return new PsychologistDTO(psychologist);
    }

    @Transactional
    public PsychologistDTO create(PsychologistInsertDTO dto) {
        if (psychologistRepository.existsByNameAndCrp(dto.getName(), dto.getCrp())) {
            throw new IllegalArgumentException(
                    "Já existe um(a) psicólogo(a) cadastrado(a) com o nome '" + dto.getName() +
                    "' e CRP '" + dto.getCrp() + "'.");
        }
        Psychologist psychologist = new Psychologist();
        copyDtoToEntity(dto, psychologist);
        psychologist = psychologistRepository.save(psychologist);

        String token = UUID.randomUUID().toString();

        String subject = "SyncCarreira - Primeiro Acesso";
        Map<String, Object> map = new HashMap<>();
        map.put("recipientName", dto.getName());
        map.put("email", dto.getEmail());
        map.put("link", recoverUri + token);

        PasswordRecover passwordRecover = new PasswordRecover();
        passwordRecover.setEmail(dto.getEmail());
        passwordRecover.setToken(token);
        passwordRecover.setExpiration(Instant.now().plusSeconds(tokenMinutes * 60L));
        passwordRecover = passwordRecoverRepository.save(passwordRecover);

        eventPublisher.publishEvent(new EmailEvent(dto.getEmail(), subject, map));

        return new PsychologistDTO(psychologist);
    }

    @Transactional
    public PsychologistDTO update(Long id, PsychologistUpdateDTO dto) {
        Psychologist psychologist = psychologistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found."));
        copyDtoToEntity(dto, psychologist);
        psychologist = psychologistRepository.save(psychologist);
        return new PsychologistDTO(psychologist);
    }

    @Transactional
    public void delete(Long id) {
        if (!psychologistRepository.existsById(id)) {
            throw new EntityNotFoundException("Psicóloga não encontrada. ID: " + id);
        }
        psychologistRepository.deleteById(id);
    }

    public void validateIfContractIsActive(Long id) {
        Psychologist psychologist = psychologistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Resource not found."));
        if (!psychologist.isContractValid()) {
            throw new IllegalStateException(
                    "Operação bloqueada: o contrato da psicóloga '" +
                            psychologist.getName() + "' está vencido desde " +
                            psychologist.getContractExpirationDate() + ".");
        }
    }

    private void copyDtoToEntity(PsychologistInsertDTO dto, Psychologist entity) {
        entity.setName(dto.getName());
        entity.setEmail(dto.getEmail());
        entity.setContractExpirationDate(dto.getContractExpirationDate());
        entity.setCrp(dto.getCrp());
        entity.getRoles().clear();
        Optional<Role> role = roleRepository.findById(3L);
        role.ifPresent(entity::addRole);
    }

    private void copyDtoToEntity(PsychologistUpdateDTO dto, Psychologist entity) {
        entity.setName(dto.getName());
        entity.setEmail(dto.getEmail());
        entity.setContractExpirationDate(dto.getContractExpirationDate());
        entity.setCrp(dto.getCrp());
        entity.getRoles().clear();
        Optional<Role> role = roleRepository.findById(3L);
        role.ifPresent(entity::addRole);
    }
}
