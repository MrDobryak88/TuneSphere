package com.tunesphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Set;

@Entity
@Table(name = "Artists")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Artist extends BaseEntity{
    @Column(nullable = false,length = 50)
    private String name;

    @Column(nullable = false,length = 1000)
    private String bio;

    @OneToMany(mappedBy = )
    private Set<Song> song;

    private Long countFollowers;

}
