/**
 * Mục đích: Controller User
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController public class UserController {
// TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
@GetMapping("/api/users/{id}") public ResponseEntity<?> a(@PathVariable Long id){/* Example */ return ResponseEntity.ok().build();}
@GetMapping("/api/users") public ResponseEntity<?> b(){/* Example */ return ResponseEntity.ok().build();}
@PutMapping("/api/users/{id}") public ResponseEntity<?> c(@PathVariable Long id,@RequestBody Object r){/* Example */ return ResponseEntity.ok().build();}
@PutMapping("/api/users/{id}/block") public ResponseEntity<?> d(@PathVariable Long id,@RequestParam boolean blocked){/* Example */ return ResponseEntity.ok().build();}
}