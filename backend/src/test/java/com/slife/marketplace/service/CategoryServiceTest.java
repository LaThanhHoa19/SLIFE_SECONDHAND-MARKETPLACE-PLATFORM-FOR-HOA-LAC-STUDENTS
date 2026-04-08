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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
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

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("getAllCategories")
    class GetAll {

        @Test
        @DisplayName("Luồng chính: map list entity -> response")
        void shouldMapAll() {
            Category c1 = category(1L, "A", false);
            c1.setDescription("d1");
            Category c2 = category(2L, "B", true);
            when(categoryRepository.findAll()).thenReturn(List.of(c1, c2));

            List<CategoryResponse> out = categoryService.getAllCategories();

            assertEquals(2, out.size());
            assertEquals(1L, out.get(0).getId());
            assertEquals("A", out.get(0).getName());
            assertEquals(Boolean.FALSE, out.get(0).isSystemLocked());
            assertEquals(2L, out.get(1).getId());
            assertEquals(Boolean.TRUE, out.get(1).isSystemLocked());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("createCategory")
    class Create {

        @Test
        @DisplayName("name null/blank -> INVALID_INPUT")
        void nameMissing_shouldThrow() {
            SlifeException ex1 = assertThrows(SlifeException.class,
                    () -> categoryService.createCategory(req(null, "d", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex1.getErrorCode());
            SlifeException ex2 = assertThrows(SlifeException.class,
                    () -> categoryService.createCategory(req("  ", "d", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex2.getErrorCode());
        }

        @Test
        @DisplayName("Trùng tên (ignore case) -> INVALID_INPUT")
        void duplicateName_shouldThrow() {
            when(categoryRepository.findByNameIgnoreCase("Phones")).thenReturn(Optional.of(category(1L, "Phones", false)));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.createCategory(req("Phones", "d", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("parentId không hợp lệ -> INVALID_INPUT")
        void invalidParent_shouldThrow() {
            when(categoryRepository.findByNameIgnoreCase("A")).thenReturn(Optional.empty());
            when(categoryRepository.findById(9L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.createCategory(req("A", "d", 9L)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: trim name + blank description -> null; set createdAt/updatedAt; save")
        void happyPath_shouldSave() {
            when(categoryRepository.findByNameIgnoreCase("A")).thenReturn(Optional.empty());
            when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
                Category c = inv.getArgument(0);
                c.setId(10L);
                return c;
            });

            CategoryResponse out = categoryService.createCategory(req("  A  ", "   ", null));

            assertEquals(10L, out.getId());
            assertEquals("A", out.getName());
            assertNull(out.getDescription());
            ArgumentCaptor<Category> cap = ArgumentCaptor.forClass(Category.class);
            verify(categoryRepository).save(cap.capture());
            assertNotNull(cap.getValue().getCreatedAt());
            assertNotNull(cap.getValue().getUpdatedAt());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("updateCategory")
    class Update {

        @Test
        @DisplayName("id null -> INVALID_INPUT")
        void nullId_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.updateCategory(null, req("A", "d", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không tìm thấy category -> INVALID_INPUT")
        void notFound_shouldThrow() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.updateCategory(1L, req("A", "d", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Category systemLocked -> FORBIDDEN")
        void locked_shouldThrow() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category(1L, "A", true)));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.updateCategory(1L, req("B", "d", null)));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }

        @Test
        @DisplayName("Tên trùng với category khác -> INVALID_INPUT")
        void duplicateOther_shouldThrow() {
            Category current = category(1L, "A", false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(current));
            when(categoryRepository.findByNameIgnoreCase("B")).thenReturn(Optional.of(category(2L, "B", false)));
            SlifeException ex = assertThrows(SlifeException.class,
                    () -> categoryService.updateCategory(1L, req("B", "d", null)));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Luồng chính: update name/desc/parent + updatedAt + save")
        void happyPath_shouldUpdate() {
            Category current = category(1L, "A", false);
            Category parent = category(9L, "P", false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(current));
            when(categoryRepository.findByNameIgnoreCase("B")).thenReturn(Optional.empty());
            when(categoryRepository.findById(9L)).thenReturn(Optional.of(parent));
            when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));

            CategoryResponse out = categoryService.updateCategory(1L, req("  B  ", "  desc  ", 9L));

            assertEquals(1L, out.getId());
            assertEquals("B", out.getName());
            assertEquals("desc", out.getDescription());
            assertEquals(9L, out.getParentId());
            assertNotNull(current.getUpdatedAt());
        }
    }

    // ---------------------------------------------------------------------
    @Nested
    @DisplayName("deleteCategory")
    class Delete {

        @Test
        @DisplayName("id null -> INVALID_INPUT")
        void nullId_shouldThrow() {
            SlifeException ex = assertThrows(SlifeException.class, () -> categoryService.deleteCategory(null));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("Không tìm thấy -> INVALID_INPUT")
        void notFound_shouldThrow() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.empty());
            SlifeException ex = assertThrows(SlifeException.class, () -> categoryService.deleteCategory(1L));
            assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
        }

        @Test
        @DisplayName("systemLocked -> FORBIDDEN")
        void locked_shouldThrow() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category(1L, "A", true)));
            SlifeException ex = assertThrows(SlifeException.class, () -> categoryService.deleteCategory(1L));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
            verify(categoryRepository, never()).deleteById(anyLong());
        }

        @Test
        @DisplayName("Luồng chính -> deleteById")
        void happyPath_shouldDelete() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(category(1L, "A", false)));
            categoryService.deleteCategory(1L);
            verify(categoryRepository).deleteById(1L);
        }
    }
}

