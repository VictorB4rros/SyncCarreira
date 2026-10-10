package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.InformationLink;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

// Usa os links cadastrados no import.sql
@DataJpaTest
@ActiveProfiles("test")
public class InformationLinkRepositoryTests {

    @Autowired
    private InformationLinkRepository repository;

    @Test
    void findByKnowledgeAreaInShouldReturnOnlyLinksOfGivenAreasOrderedByTopic() {
        List<InformationLink> result = repository.findByKnowledgeAreaInOrderByTopicAscIdAsc(List.of(KnowledgeArea.BIOLOGICAS));

        Assertions.assertEquals(2, result.size());
        Assertions.assertEquals("Agronomia", result.get(0).getTopic());
        Assertions.assertEquals("Educação Física", result.get(1).getTopic());
    }

    @Test
    void findByKnowledgeAreaInShouldReturnLinksOfAllGivenAreas() {
        List<InformationLink> result = repository.findByKnowledgeAreaInOrderByTopicAscIdAsc(
                List.of(KnowledgeArea.HUMANAS, KnowledgeArea.EXATAS));

        Assertions.assertEquals(14, result.size());
        Assertions.assertTrue(result.stream().allMatch(link ->
                link.getKnowledgeArea() == KnowledgeArea.HUMANAS || link.getKnowledgeArea() == KnowledgeArea.EXATAS));
    }

    @Test
    void findByKnowledgeAreaIsNullShouldReturnUniversityAccessLinks() {
        List<InformationLink> result = repository.findByKnowledgeAreaIsNullOrderByTopicAscIdAsc();

        Assertions.assertEquals(List.of("ENEM", "FIES", "ProUni", "SISU"),
                result.stream().map(InformationLink::getTopic).toList());
    }

    @Test
    void findAllShouldReturnLinksOfAllAreasAndUniversityAccessLinks() {
        List<InformationLink> result = repository.findAllByOrderByTopicAscIdAsc();

        Assertions.assertEquals(26, result.size());
        Assertions.assertEquals(4, result.stream().filter(link -> link.getKnowledgeArea() == null).count());
    }
}
