package com.slife.marketplace.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;

import com.slife.marketplace.dto.response.ApiResponse;
import com.slife.marketplace.dto.response.UserResponseDTO;
import com.slife.marketplace.service.AdminService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.ResponseEntity;

class AdminControllerTest {

  @Test
  void getUsers_shouldReturnPagedUsers() {
    AdminService adminService = org.mockito.Mockito.mock(AdminService.class);
    AdminController controller = new AdminController(adminService);

    List<UserResponseDTO> mockedUsers = List.of(
        new UserResponseDTO(1L, "Test User", "user@slife.vn", "ACTIVE", "USER", new BigDecimal("5.00")));
    Page<UserResponseDTO> mockedPage = new PageImpl<>(mockedUsers);

    when(adminService.getUsers(0, 20)).thenReturn(mockedPage);

    ResponseEntity<ApiResponse<Page<UserResponseDTO>>> response = controller.getUsers(0, 20);

    assertEquals(200, response.getStatusCode().value());
    assertFalse(response.getBody().getData().isEmpty());
    assertEquals("user@slife.vn", response.getBody().getData().getContent().get(0).email());
  }
}
