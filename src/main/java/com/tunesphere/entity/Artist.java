package com.tunesphere.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "artists")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Artist extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 2000)
    private String bio;

    @Column(name = "avatar_url", length = 200)
    private String avatarUrl;


    @ManyToMany(mappedBy = "artists")
    private Set<Album> albums = new HashSet<>();

    @ManyToMany(mappedBy = "artists", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<Song> songs = new HashSet<>();

    @Column(name = "followers_count", nullable = false)
    private Long followersCount = 0L;
    public void addSong(Song song) {
        this.songs.add(song);
        song.getArtists().add(this);
    }

    public void removeSong(Song song) {
        this.songs.remove(song);
        song.getArtists().remove(this);
    }
}