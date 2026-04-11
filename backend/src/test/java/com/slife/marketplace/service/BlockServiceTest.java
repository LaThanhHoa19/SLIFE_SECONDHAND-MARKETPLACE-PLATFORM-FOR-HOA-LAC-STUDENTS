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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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
        u.setFullName("U" + id);
        return u;
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("block")
    class BlockUser {

        @Test
        @DisplayName("blocker null hoặc blockedUserId null -> INVALID_INPUT")
        void nullInputs_shouldThrow() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> blockService.block(null, 1L)).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> blockService.block(user(1L), null)).getErrorCode());
        }

        @Test
        @DisplayName("Tự block chính mình -> INVALID_INPUT")
        void selfBlock_shouldThrow() {
            User me = user(1L);
            SlifeException ex = assertThrows(SlifeException.class, () -> blockService.block(me, 1L));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("User bị block không tồn tại -> USER_NOT_FOUND")
        void blockedMissing_shouldThrow() {
            when(userRepository.findById(2L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> blockService.block(user(1L), 2L));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Chưa tồn tại block -> tạo Block row + cắt follow 2 chiều")
        void newBlock_shouldSaveAndSeverFollows() {
            User blocker = user(1L);
            User blocked = user(2L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(false);

            blockService.block(blocker, 2L);

            ArgumentCaptor<Block> cap = ArgumentCaptor.forClass(Block.class);
            verify(blockRepository).save(cap.capture());
            assertEquals(1L, cap.getValue().getBlocker().getId());
            assertEquals(2L, cap.getValue().getBlocked().getId());
            assertNotNull(cap.getValue().getCreatedAt());
            verify(followRepository).deleteByFollower_IdAndFollowed_Id(1L, 2L);
            verify(followRepository).deleteByFollower_IdAndFollowed_Id(2L, 1L);
        }

        @Test
        @DisplayName("Đã tồn tại block -> không save lại, vẫn cắt follow 2 chiều")
        void existedBlock_shouldNotSaveButStillSeverFollows() {
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("unblock")
    class UnblockUser {

        @Test
        @DisplayName("blocker null hoặc blockedUserId null -> INVALID_INPUT")
        void nullInputs_shouldThrow() {
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> blockService.unblock(null, 1L)).getErrorCode());
            assertEquals(ErrorCode.INVALID_INPUT,
                    assertThrows(SlifeException.class, () -> blockService.unblock(user(1L), null)).getErrorCode());
        }

        @Test
        @DisplayName("Tự unblock chính mình -> INVALID_INPUT")
        void selfUnblock_shouldThrow() {
            User me = user(1L);
            SlifeException ex = assertThrows(SlifeException.class, () -> blockService.unblock(me, 1L));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("User không tồn tại -> USER_NOT_FOUND")
        void blockedMissing_shouldThrow() {
            when(userRepository.existsById(2L)).thenReturn(false);
            SlifeException ex = assertThrows(SlifeException.class, () -> blockService.unblock(user(1L), 2L));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính -> gọi deleteByBlocker_IdAndBlocked_Id")
        void happyPath_shouldDelete() {
            when(userRepository.existsById(2L)).thenReturn(true);
            blockService.unblock(user(1L), 2L);
            verify(blockRepository).deleteByBlocker_IdAndBlocked_Id(1L, 2L);
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("isBlocked*")
    class BlockQueries {

        @Test
        @DisplayName("isBlockedByCurrentUser: id null -> false")
        void isBlockedByCurrentUser_null_shouldFalse() {
            assertFalse(blockService.isBlockedByCurrentUser(null, 2L));
            assertFalse(blockService.isBlockedByCurrentUser(1L, null));
        }

        @Test
        @DisplayName("isBlockedEitherDirection: id null -> false")
        void isBlockedEitherDirection_null_shouldFalse() {
            assertFalse(blockService.isBlockedEitherDirection(null, 2L));
            assertFalse(blockService.isBlockedEitherDirection(1L, null));
        }

        @Test
        @DisplayName("isBlockedEitherDirection: true nếu 1 trong 2 chiều tồn tại")
        void isBlockedEitherDirection_shouldCheckBothDirections() {
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(false);
            when(blockRepository.existsByBlocker_IdAndBlocked_Id(2L, 1L)).thenReturn(true);
            assertTrue(blockService.isBlockedEitherDirection(1L, 2L));
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getBlockedUsers")
    class GetBlockedUsers {

        @Test
        @DisplayName("blockerId null -> INVALID_INPUT")
        void nullBlocker_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> blockService.getBlockedUsers(null, 0, 20, null, null));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("blockerId không tồn tại -> USER_NOT_FOUND")
        void blockerMissing_shouldThrow() {
            when(userRepository.existsById(1L)).thenReturn(false);
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> blockService.getBlockedUsers(1L, 0, 20, null, null));
            assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("Clamp page/size: page<0 -> 0; size<=0 -> 1; size>50 -> 50")
        void paging_shouldClamp() {
            when(userRepository.existsById(1L)).thenReturn(true);
            when(blockRepository.findBlockedUserSummariesByBlockerId(eq(1L), eq(""), eq(true), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            blockService.getBlockedUsers(1L, -3, 0, null, null);
            blockService.getBlockedUsers(1L, 0, 999, null, null);

            ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
            verify(blockRepository, times(2)).findBlockedUserSummariesByBlockerId(eq(1L), eq(""), eq(true), cap.capture());
            List<Pageable> p = cap.getAllValues();
            assertEquals(0, p.get(0).getPageNumber());
            assertEquals(1, p.get(0).getPageSize());
            assertEquals(50, p.get(1).getPageSize());
        }

        @Test
        @DisplayName("Luồng chính -> trả page từ repository")
        void happyPath_shouldReturnPage() {
            when(userRepository.existsById(1L)).thenReturn(true);
            Page<FollowUserSummaryResponse> page = new PageImpl<>(List.of());
            when(blockRepository.findBlockedUserSummariesByBlockerId(eq(1L), eq(""), eq(true), any(Pageable.class)))
                    .thenReturn(page);
            assertSame(page, blockService.getBlockedUsers(1L, 0, 20, null, null));
        }
    }
}

