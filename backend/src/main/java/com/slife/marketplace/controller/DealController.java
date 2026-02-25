/**
 * Mục đích: Controller Deal
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController public class DealController {
// TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
@PostMapping("/api/deals") public ResponseEntity<?> m1(@RequestBody Object r){return ResponseEntity.ok().build();}
@GetMapping("/api/deals/{id}") public ResponseEntity<?> m2(@PathVariable Long id){return ResponseEntity.ok().build();}
@PutMapping("/api/deals/{id}/confirm") public ResponseEntity<?> m3(@PathVariable Long id){return ResponseEntity.ok().build();}
@PutMapping("/api/deals/{id}/cancel") public ResponseEntity<?> m4(@PathVariable Long id,@RequestBody Object r){return ResponseEntity.ok().build();}
@GetMapping("/api/users/{id}/deals") public ResponseEntity<?> m5(@PathVariable Long id){return ResponseEntity.ok().build();}
}