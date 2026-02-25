/**
 * Mục đích: Controller Offer
 * Endpoints liên quan: api
 * TODO implement:
 * - Hoàn thiện nghiệp vụ tại service layer theo đúng use case.
 * - Bổ sung validation, security, transaction boundaries và logging/audit.
 * - Viết unit/integration tests cho happy path + edge cases + error cases.
 */
package com.slife.marketplace.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController public class OfferController {
// TODO: thêm đầy đủ endpoint theo spec, ví dụ request/response JSON trong từng method.
@PostMapping("/api/listings/{id}/offers") public ResponseEntity<?> m1(@PathVariable Long id,@RequestBody Object r){return ResponseEntity.ok().build();}
@GetMapping("/api/listings/{id}/offers") public ResponseEntity<?> m2(@PathVariable Long id){return ResponseEntity.ok().build();}
@PutMapping("/api/offers/{id}/accept") public ResponseEntity<?> m3(@PathVariable Long id){return ResponseEntity.ok().build();}
@PutMapping("/api/offers/{id}/reject") public ResponseEntity<?> m4(@PathVariable Long id){return ResponseEntity.ok().build();}
}