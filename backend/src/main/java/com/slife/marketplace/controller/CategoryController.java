/**
 * Mục đích: Controller Category
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController public class CategoryController {
// TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
@GetMapping("/api/categories") public ResponseEntity<?> m1(){return ResponseEntity.ok().build();}
@PostMapping("/api/categories") public ResponseEntity<?> m2(@RequestBody Object r){return ResponseEntity.ok().build();}
@PutMapping("/api/categories/{id}") public ResponseEntity<?> m3(@PathVariable Long id,@RequestBody Object r){return ResponseEntity.ok().build();}
}