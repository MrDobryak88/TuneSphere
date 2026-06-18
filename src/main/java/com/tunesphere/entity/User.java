package com.tunesphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table
@Getter
@Setter
@SuperBuilder // Используем билдер который использует поля родителя
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true) // Чтобы equals/hashCode учитывали поля из BaseEntity
@ToString(callSuper = true) // Чтобы toString включал id, createdAt и updatedAt

public class User extends BaseEntity{

    @Column
    private String username;

    @Column
    private String email;

    @Column
    private String password;

    @Column
    private Role role;

    @Column
    private String avatarUrl;



}
