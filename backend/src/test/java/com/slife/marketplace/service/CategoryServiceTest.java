package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCategoryRequest;
import com.slife.marketplace.dto.response.CategoryResponse;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import com.slife.marketplace.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock private CategoryRepository categoryRepository;

    private CategoryService categoryService;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository);
    }

    private static CreateCategoryRequest req(String name, String description, Long parentId) {
        CreateCategoryRequest r = new CreateCategoryRequest();
        r.setName(name);
        r.setDescription(description);
        r.setParentId(parentId);
        return r;
    }

    private static Category category(long id, String name, boolean locked) {
        Category c = new Category();
        c.setId(id);
        c.setName(name);
        c.setSystemLocked(locked);
        c.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        c.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        return c;
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Tạo danh mục | Function: createCategory(CreateCategoryRequest)")
    class CreateUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [N] Tên duy nhất + danh mục cha hợp lệ → tạo thành công, trim tên, ánh xạ parent")
        void utcid01_createWithUniqueNameAndParent() {
            Category parent = category(10L, "Parent", false);
            when(categoryRepository.findByNameIgnoreCase("Electronics")).thenReturn(Optional.empty());
            when(categoryRepository.findById(10L)).thenReturn(Optional.of(parent));
            when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
                Category c = inv.getArgument(0);
                c.setId(5L);
                return c;
            });

            CategoryResponse out = categoryService.createCategory(req("  Electronics  ", "đồ điện tử", 10L));

            assertEquals(5L, out.getId());
            assertEquals("Electronics", out.getName());
            assertEquals(10L, out.getParentId());
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [A] Tên đã tồn tại trong hệ thống (không phân biệt hoa thường) → INVALID_INPUT")
        void utcid02_duplicateNameCaseInsensitive() {
            when(categoryRepository.findByNameIgnoreCase("Phones"))
                    .thenReturn(Optional.of(category(1L, "Phones", false)));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.createCategory(req("Phones", "mô tả", null)));

            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Sửa danh mục | Function: updateCategory(Long, CreateCategoryRequest)")
    class UpdateUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [A] Danh mục bị khóa hệ thống (systemLocked = true) → FORBIDDEN, từ chối chỉnh sửa")
        void utcid01_updateSystemLockedCategory() {
            when(categoryRepository.findById(1L))
                    .thenReturn(Optional.of(category(1L, "Đồ điện tử", true)));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.updateCategory(1L, req("Tên mới", "mô tả", null)));

            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Xóa danh mục | Function: deleteCategory(Long)")
    class DeleteUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [A] Danh mục bị khóa hệ thống (systemLocked = true) → FORBIDDEN, không xóa DB")
        void utcid01_deleteSystemLockedCategory() {
            when(categoryRepository.findById(1L))
                    .thenReturn(Optional.of(category(1L, "Đồ điện tử", true)));

            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.deleteCategory(1L));

            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
            verify(categoryRepository, never()).deleteById(anyLong());
        }

        @Test
        @Tag("UTCID-02")
        @DisplayName("UTCID-02 [N] Danh mục do người dùng tạo, không bị khóa → xóa thành công khỏi hệ thống")
        void utcid02_deleteUserCreatedCategory() {
            when(categoryRepository.findById(2L))
                    .thenReturn(Optional.of(category(2L, "Sách cũ", false)));

            assertDoesNotThrow(() -> categoryService.deleteCategory(2L));

            verify(categoryRepository).deleteById(2L);
        }
    }

    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("Kiểm tra chuẩn hóa tên | Common: normalizeName")
    class BoundaryUtc {

        @Test
        @Tag("UTCID-01")
        @DisplayName("UTCID-01 [B] Tên chỉ gồm khoảng trắng → INVALID_INPUT; tên có khoảng trắng thừa → tự trim")
        void utcid01_whitespaceName() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.createCategory(req("   ", "mô tả", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());

            when(categoryRepository.findByNameIgnoreCase("Phone")).thenReturn(Optional.empty());
            when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
                Category c = inv.getArgument(0);
                c.setId(3L);
                return c;
            });

            CategoryResponse out = categoryService.createCategory(req("  Phone  ", null, null));
            assertEquals("Phone", out.getName());
        }
    }
}
