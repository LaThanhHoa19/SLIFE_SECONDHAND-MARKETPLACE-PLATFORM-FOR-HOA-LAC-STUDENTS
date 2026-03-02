package com.slife.marketplace.controller;

import com.slife.marketplace.dto.response.AdminUserSummaryResponse;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {

  private final JdbcTemplate jdbcTemplate;

  public AdminController(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @GetMapping("/api/admin/dashboard")
  public ResponseEntity<?> m1() {
    return ResponseEntity.ok().build();
  }

  @GetMapping("/api/admin/users")
  public ResponseEntity<List<AdminUserSummaryResponse>> getUsers() {
    String sql = """
        SELECT user_id, email, full_name, role, status, reputation_score, created_at
        FROM users
        ORDER BY created_at DESC
        """;

    List<AdminUserSummaryResponse> users = jdbcTemplate.query(
        sql,
        (rs, rowNum) -> new AdminUserSummaryResponse(
            rs.getLong("user_id"),
            rs.getString("email"),
            rs.getString("full_name"),
            rs.getString("role"),
            rs.getString("status"),
            rs.getBigDecimal("reputation_score"),
            toLocalDateTime(rs.getTimestamp("created_at"))));

    return ResponseEntity.ok(users);
  }

  @PutMapping("/api/admin/configurations/{id}")
  public ResponseEntity<?> m2(@PathVariable Long id, @RequestBody Object r) {
    return ResponseEntity.ok().build();
  }

  private LocalDateTime toLocalDateTime(Timestamp value) {
    return value == null ? null : value.toLocalDateTime();
  }
}
