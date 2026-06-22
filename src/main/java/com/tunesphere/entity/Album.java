package com.tunesphere.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "albums")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Album extends BaseEntity {

    @Column(nullable = false)
    @NotBlank(message = "Название альбома не может быть пустым")
    @Size(min = 3, max = 150, message = "Название альбома должно содержать от 3 до 150 символов")
    private String title;

    @Column()
    @Size(min = 3,max = 2000, message = "Описание должно содержать от 3 до 2000 символов")
    private String description;

    @Column(name = "release_year")
    @NotNull
    @NotBlank
    @FutureOrPresent(message = "Нельзя выпустить трек в прошлом ")
    private LocalDateTime releaseDate;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "artist_id",
            joinColumns = @JoinColumn(name = "album_id"),
            inverseJoinColumns = @JoinColumn(name = "artist_id" )
    )
    @ToString.Exclude
    private Set<Artist> artists;

    @ToString.Exclude
    @OneToMany(mappedBy = "album", fetch = FetchType.LAZY,cascade = CascadeType.ALL)
    private Set<Song> songs = new HashSet<>();
}