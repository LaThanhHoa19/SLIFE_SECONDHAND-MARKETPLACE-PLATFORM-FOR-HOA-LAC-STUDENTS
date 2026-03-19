package com.slife.marketplace.service;

import com.slife.marketplace.dto.request.CreateCategoryRequest;
import com.slife.marketplace.dto.response.CategoryResponse;
import com.slife.marketplace.entity.Category;
import com.slife.marketplace.repository.CategoryRepository;
import com.slife.marketplace.exception.ErrorCode;
import com.slife.marketplace.exception.SlifeException;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String name = normalizeName(request.getName());

        Optional<Category> existing = categoryRepository.findByNameIgnoreCase(name);
        if (existing.isPresent()) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Category name already exists");
        }

        Category parent = resolveParent(request.getParentId());

        Category category = new Category();
        category.setName(name);
        category.setDescription(blankToNull(request.getDescription()));
        category.setParent(parent);
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CreateCategoryRequest request) {
        if (id == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Category id is required");
        }

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Category not found"));

        String name = normalizeName(request.getName());
        Optional<Category> existing = categoryRepository.findByNameIgnoreCase(name);
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Category name already exists");
        }

        Category parent = resolveParent(request.getParentId());

        category.setName(name);
        category.setDescription(blankToNull(request.getDescription()));
        category.setParent(parent);
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (id == null) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Category id is required");
        }
        if (!categoryRepository.existsById(id)) {
            throw new SlifeException(ErrorCode.INVALID_INPUT, "Category not found");
        }
        categoryRepository.deleteById(id);
    }

    private CategoryResponse toResponse(Category c) {
        CategoryResponse res = new CategoryResponse();
        res.setId(c.getId());
        res.setName(c.getName());
        res.setDescription(c.getDescription());
        res.setParentId(c.getParent() != null ? c.getParent().getId() : null);
        return res;
    }

    private static String normalizeName(String raw) {
        if (raw == null) throw new SlifeException(ErrorCode.INVALID_INPUT, "name is required");
        String v = raw.trim();
        if (v.isBlank()) throw new SlifeException(ErrorCode.INVALID_INPUT, "name is required");
        return v;
    }

    private Category resolveParent(Long parentId) {
        if (parentId == null) return null;
        return categoryRepository.findById(parentId)
                .orElseThrow(() -> new SlifeException(ErrorCode.INVALID_INPUT, "Invalid parentId"));
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String v = s.trim();
        return v.isEmpty() ? null : v;
    }
}
