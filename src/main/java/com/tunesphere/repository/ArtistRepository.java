package com.tunesphere.repository;

import com.tunesphere.entity.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    boolean existsByNameIgnoreCase(String name);
}