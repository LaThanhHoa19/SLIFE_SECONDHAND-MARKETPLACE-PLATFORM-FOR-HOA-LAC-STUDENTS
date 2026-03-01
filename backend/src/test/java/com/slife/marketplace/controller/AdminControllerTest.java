package com.slife.marketplace.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.slife.marketplace.dto.response.AdminUserSummaryResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class AdminControllerTest {

  @Test
  void getUsers_shouldReturnUsersFromDatabase() {
    JdbcTemplate jdbcTemplate = org.mockito.Mockito.mock(JdbcTemplate.class);
    AdminController controller = new AdminController(jdbcTemplate);

    List<AdminUserSummaryResponse> mockedUsers = List.of(
        new AdminUserSummaryResponse(1L, "admin@slife.vn", "Admin", "ADMIN", "ACTIVE", new BigDecimal("5.00"), LocalDateTime.now()));

    when(jdbcTemplate.query(anyString(), any(RowMapper.class))).thenReturn(mockedUsers);

    ResponseEntity<List<AdminUserSummaryResponse>> response = controller.getUsers();

    assertEquals(200, response.getStatusCode().value());
    assertFalse(response.getBody().isEmpty());
    assertEquals("admin@slife.vn", response.getBody().get(0).email());
  }
}
