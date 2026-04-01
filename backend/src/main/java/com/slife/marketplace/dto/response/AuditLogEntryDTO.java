package com.slife.marketplace.dto.response;

import java.time.Instant;

public record AuditLogEntryDTO(
        Long id,
        Instant occurredAt,
        Long actorUserId,
        String actorType,
        String action,
        String entityType,
        Long entityId,
        String payloadJson
) {}
