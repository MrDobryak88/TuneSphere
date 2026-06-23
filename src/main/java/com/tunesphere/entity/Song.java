package com.tunesphere.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "songs")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Song extends BaseEntity {


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id")
    private Album album;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "songs_artists",
            joinColumns = @JoinColumn(name = "song_id"),
            inverseJoinColumns = @JoinColumn(name = "artist_id")
    )
    @Builder.Default
    private Set<Artist> artists = new HashSet<>();

    @ManyToMany(mappedBy = "songs", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Playlist> playlists = new HashSet<>();
    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    @Positive
    private Integer duration; // в секундах

    @Column(name = "audio_url", nullable = false, length = 500)
    private String audioUrl;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @Column(name = "play_count", nullable = false)
    private Long playCount = 0L;
    @Column(name = "lyrics",length = 2000)
    private String lyrics;
    @Column(length = 50)
    private String genre;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}