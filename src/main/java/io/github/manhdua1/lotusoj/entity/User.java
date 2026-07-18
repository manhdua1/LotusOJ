package io.github.manhdua1.lotusoj.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, unique = true)
    String email;

    @Column(nullable = false, unique = true)
    String username;

    @Column(name = "password_hash", nullable = false)
    String passwordHash;

    @Column(name = "avatar_url")
    String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    Status status = Status.PENDING_VERIFICATION;

    @Column(name = "total_solved", nullable = false)
    @Builder.Default
    Integer totalSolved = 0;

    @Column(name = "total_submissions", nullable = false)
    @Builder.Default
    Integer totalSubmissions = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;

    public enum Role {
        USER,
        PROBLEM_SETTER,
        CONTEST_MANAGER,
        ADMIN
    }

    public enum Status {
        PENDING_VERIFICATION,
        ACTIVE,
        BANNED
    }
}
