/**
 * Mục đích: Controller Block
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController public class BlockController {
// TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
@PostMapping("/api/users/{id}/block") public ResponseEntity<?> m1(@PathVariable Long id){return ResponseEntity.ok().build();}
@DeleteMapping("/api/users/{id}/block") public ResponseEntity<?> m2(@PathVariable Long id){return ResponseEntity.ok().build();}
}