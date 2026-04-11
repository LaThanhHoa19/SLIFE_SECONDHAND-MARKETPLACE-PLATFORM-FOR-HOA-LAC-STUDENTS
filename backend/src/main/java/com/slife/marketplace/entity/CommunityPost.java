package com.slife.marketplace.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "community_posts", indexes = {
        @Index(name = "idx_community_posts_status_created", columnList = "status,created_at"),
        @Index(name = "idx_community_posts_author", columnList = "author_id")
})
public class CommunityPost {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_HIDDEN = "HIDDEN";
    public static final String STATUS_DELETED = "DELETED";
    public static final String STATUS_BANNED = "BANNED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Size(max = 50)
    @Column(name = "title", length = 300)
    private String title;

    @Size(max = 1000)
    @Lob
    @Column(name = "description")
    private String description;

    @NotNull
    @ColumnDefault("'ACTIVE'")
    @Column(name = "status", nullable = false, length = 30)
    private String status = STATUS_ACTIVE;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "hidden_at")
    private Instant hiddenAt;

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<CommunityPostImage> images = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "community_post_hashtags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "hashtag_id")
    )
    private Set<Hashtag> hashtags = new HashSet<>();
}
