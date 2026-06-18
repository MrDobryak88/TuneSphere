package com.tunesphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "Playlists")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Playlist extends BaseEntity{

    private String name;

    private Boolean isPublic;

    @Column(name = "user_id")
    private Long userId;

    private Long songsId;

}
