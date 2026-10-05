package com.synccarreira.synccarreira_api.repositories;

import com.synccarreira.synccarreira_api.entities.InformationLink;
import com.synccarreira.synccarreira_api.entities.enums.KnowledgeArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface InformationLinkRepository extends JpaRepository<InformationLink, Long> {

    List<InformationLink> findByKnowledgeAreaInOrderByTopicAscIdAsc(Collection<KnowledgeArea> knowledgeAreas);

    List<InformationLink> findByKnowledgeAreaIsNullOrderByTopicAscIdAsc();
}
