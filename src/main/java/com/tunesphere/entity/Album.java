package com.tunesphere.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

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
    @Size(min = 3, max = 2000, message = "Описание должно содержать от 3 до 2000 символов")
    private String description;

    @Column(name = "release_year")
    @Min(value = 1900, message = "Год выпуска не может быть раньше 1900")
    @Max(value = 2100, message = "Год выпуска не может быть позже 2100")
    private Integer releaseYear;

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @ManyToMany
    @JoinTable(
            name = "album_artists",
            joinColumns = @JoinColumn(name = "album_id"),
            inverseJoinColumns = @JoinColumn(name = "artist_id")
    )
    private Set<Artist> artists = new HashSet<>();

    @ToString.Exclude
    @OneToMany(mappedBy = "album", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private Set<Song> songs = new HashSet<>();
}
