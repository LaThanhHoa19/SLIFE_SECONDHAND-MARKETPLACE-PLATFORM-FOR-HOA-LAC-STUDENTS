package com.slife.marketplace.service;

import com.slife.marketplace.dto.response.FollowUserSummaryResponse;
import com.slife.marketplace.entity.Block;
import com.slife.marketplace.entity.User;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.BlockRepository;
import com.slife.marketplace.repository.FollowRepository;
import com.slife.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("BlockService - UTC theo 5 kịch bản lớn")
class BlockServiceTest {

    @Mock private BlockRepository blockRepository;
    @Mock private UserRepository userRepository;
    @Mock private FollowRepository followRepository;

    private BlockService blockService;

    @BeforeEach
    void setUp() {
        blockService = new BlockService(blockRepository, userRepository, followRepository);
    }

    private static User user(long id) {
        User u = new User();
        u.setId(id);
        u.setEmail("u" + id + "@ex.com");
        return u;
    }

    @Nested
    @DisplayName("Nhóm 1 - Chặn user")
    class BlockUserUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [N] A block B: lưu block + xóa follow 2 chiều")
        void utcid01_blockNewUserAndSeverBothFollowDirections() {
            User blocker = user(1L);
            User blocked = user(2L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(false);

            blockService.block(blocker, 2L);

            ArgumentCaptor<Block> blockCaptor = ArgumentCaptor.forClass(Block.class);
            verify(blockRepository).save(blockCaptor.capture());
            Block saved = blockCaptor.getValue();
            assertEquals(1L, saved.getBlocker().getId());
            assertEquals(2L, saved.getBlocked().getId());
            assertNotNull(saved.getCreatedAt());

            verify(followRepository).deleteByFollower_IdAndFollowed_Id(1L, 2L);
            verify(followRepository).deleteByFollower_IdAndFollowed_Id(2L, 1L);
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID02 [A] block self hoặc block user không tồn tại: chặn thao tác")
        void utcid02_selfBlockOrMissingTargetShouldThrow() {
            SlifeException selfEx = assertThrows(SlifeException.class, () -> blockService.block(user(1L), 1L));
            assertEquals(ErrorCode.INVALID_INPUT, selfEx.getErrorCode());

            when(userRepository.findById(999L)).thenReturn(Optional.empty());
            SlifeException missingEx = assertThrows(SlifeException.class, () -> blockService.block(user(1L), 999L));
            assertEquals(ErrorCode.USER_NOT_FOUND, missingEx.getErrorCode());
        }

        @Test
        @Tag("UTCID-03")
        @DisplayName("UTCID03 [B] block trùng lặp: không save thêm, vẫn xóa follow 2 chiều")
        void utcid03_idempotentBlockDoesNotDuplicateData() {
            User blocker = user(1L);
            User blocked = user(2L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(true);

            blockService.block(blocker, 2L);

            verify(blockRepository, never()).save(any());
            verify(followRepository).deleteByFollower_IdAndFollowed_Id(1L, 2L);
            verify(followRepository).deleteByFollower_IdAndFollowed_Id(2L, 1L);
        }
    }

    @Nested
    @DisplayName("Nhóm 2 - Bỏ chặn user")
    class UnblockUserUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [N] Unblock thành công: xóa bản ghi block")
        void utcid01_unblockRemovesBlockRecord() {
            when(userRepository.existsById(2L)).thenReturn(true);

            blockService.unblock(user(1L), 2L);

            verify(blockRepository).deleteByBlocker_IdAndBlocked_Id(1L, 2L);
        }
    }

    @Nested
    @DisplayName("Nhóm 3 - Danh sách block (paging protection)")
    class BlockListUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID01 [B] page âm/size xấu: tự bảo vệ page=0, size clamp <= 50")
        void utcid01_invalidPagingParametersAreClamped() {
            when(userRepository.existsById(1L)).thenReturn(true);
            when(blockRepository.findBlockedUserSummariesByBlockerId(eq(1L), eq(""), eq(true), any(Pageable.class)))
                    .thenReturn(new PageImpl<FollowUserSummaryResponse>(List.of()));

            blockService.getBlockedUsers(1L, -1, 0, null, null);
            blockService.getBlockedUsers(1L, 0, 999, null, null);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(blockRepository, times(2))
                    .findBlockedUserSummariesByBlockerId(eq(1L), eq(""), eq(true), pageableCaptor.capture());

            List<Pageable> used = pageableCaptor.getAllValues();
            assertEquals(0, used.get(0).getPageNumber());
            assertEquals(1, used.get(0).getPageSize());
            assertEquals(50, used.get(1).getPageSize());
        }
    }
}
