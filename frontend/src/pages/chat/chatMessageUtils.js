const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/** Khoảng cách từ đáy vùng scroll để coi là “đang xem tin mới nhất” */
export const CHAT_NEAR_BOTTOM_PX = 80;

/** Ảnh chat lưu tại /uploads/** — không được gắn prefix /api (sẽ 403 qua nginx/Spring) */
export function resolveChatImageSrc(fileUrl) {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http') || fileUrl.startsWith('blob:')) return fileUrl;
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  if (path.startsWith('/uploads/')) {
    const api = import.meta.env.VITE_API_BASE_URL || '';
    if (api.startsWith('http')) {
      try {
        return `${new URL(api).origin}${path}`;
      } catch {
        /* fall through */
      }
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return `http://localhost:8080${path}`;
  }
  return fileUrl.startsWith('http') ? fileUrl : `${API_BASE}${path}`;
}

export function getData(res) {
  const b = res?.data;
  return b?.data ?? b;
}

export function makeTempId() {
  return `tmp_${Date.now()}_${Math.random()}`;
}

export function isMessageFromCurrentUser(msg, currentUserId) {
  // Ưu tiên senderId vì isFromCurrentUser từ WS được tính theo ngữ cảnh phía server sender.
  if (currentUserId != null && msg?.senderId != null) {
    return Number(msg.senderId) === Number(currentUserId);
  }
  return msg?.isFromCurrentUser === true;
}

export function upsertMessages(prev, incoming, { dropPending = false } = {}) {
  const list = Array.isArray(prev) ? [...prev] : [];
  const source = dropPending ? list.filter((m) => !m?._pending) : list;
  const add = Array.isArray(incoming) ? incoming : [incoming];
  const byId = new Map();

  for (const m of source) {
    if (m == null) continue;
    byId.set(String(m.id ?? makeTempId()), m);
  }
  for (const m of add) {
    if (m == null) continue;
    byId.set(String(m.id ?? makeTempId()), m);
  }
  return Array.from(byId.values());
}

/** Gợi ý khi API lỗi — ưu tiên theo vai (mua/bán). */
export const LOCAL_BUYER_CHIPS = [
  'Cho mình hỏi sản phẩm còn không ạ?',
  'Giá có thương lượng thêm được không?',
  'Mình có thể qua xem hàng trực tiếp không?',
  'Bạn có ship / giao hàng được không?',
  'Bạn đang ở khu vực nào ạ?',
  'Mình chốt nhé, giữ giúp mình.',
];
export const LOCAL_SELLER_CHIPS = [
  'Chào bạn, mình vẫn còn hàng nhé.',
  'Bạn qua xem trực tiếp được thì báo mình giờ nhé.',
  'Giá mình để là giá tốt rồi ạ.',
  'Mình có thể ship trong khu vực trường.',
  'Cảm ơn bạn đã quan tâm tin nhé!',
];

export function sameCalendarDayVi(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function formatChatDayLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today0 - d0) / 86400000);
  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

export function formatSessionTimeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = sameCalendarDayVi(iso, now.toISOString());
  if (sameDay) {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

/** Nhãn + tooltip cho trạng thái tin gửi đi (rõ hơn ✓/✓✓). */
export function getDeliveryReceiptInfo(msg, isPending) {
  if (isPending) {
    return {
      short: 'Đang gửi…',
      tooltip: 'Đang gửi tin nhắn, vui lòng chờ vài giây.',
    };
  }
  const status = String(msg?.deliveryStatus || '').toUpperCase();
  const seen = status === 'SEEN' || msg?.isSeen === true;
  const delivered = status === 'DELIVERED' || msg?.isDelivered === true;

  const formatReceiptMoment = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (seen) {
    const when = formatReceiptMoment(msg?.seenAt) || formatReceiptMoment(msg?.timestamp);
    return {
      short: 'Đã xem',
      tooltip: when
        ? `Đối phương đã xem lúc ${when}.`
        : 'Đối phương đã mở cuộc trò chuyện và thấy tin nhắn này.',
    };
  }
  if (delivered) {
    return {
      short: 'Đã nhận',
      tooltip:
        'Tin đã tới thiết bị của đối phương nhưng họ chưa mở chat hoặc chưa đọc tới đây.',
    };
  }
  return {
    short: 'Đã gửi',
    tooltip: 'Tin đã được lưu; trạng thái chi tiết sẽ cập nhật khi đối phương nhận và xem.',
  };
}

export function getReferencePreview(ref, fallbackId) {
  if (!ref) {
    if (fallbackId != null) return `[Tin nhắn #${fallbackId}]`;
    return '[Tin nhắn]';
  }
  if (ref.content && String(ref.content).trim()) {
    let text = String(ref.content).trim();
    if (
      ref.messageType === 'DEAL_CONFIRMATION' ||
      /\bXÁC NHẬN GIAO DỊCH\b/i.test(text) ||
      text.includes('Giá thỏa thuận')
    ) {
      text = formatDealConfirmationDisplayContent(text);
    }
    return text;
  }
  if (ref.messageType === 'IMAGE' && ref.fileUrl) return '[Hình ảnh]';
  if (fallbackId != null) return `[Tin nhắn #${fallbackId}]`;
  return '[Tin nhắn]';
}

export function getMessageDomId(id) {
  if (id == null) return null;
  return `chat-msg-${String(id)}`;
}

/**
 * Key cho từng dòng tin — chỉ dựa trên id (BE hoặc tmp_* khi đang gửi).
 * Không nhét index vào key: khi list thêm/bớt/đảo thứ tự, cùng một tin giữ cùng key → ít remount, cuộn mượt hơn.
 */
export function getMessageRowKey(msg, indexIfNoId = 0) {
  const id = msg?.id;
  if (id != null && id !== '') {
    return typeof id === 'string' ? id : String(id);
  }
  return `chat-row-missing-id-${indexIfNoId}-${msg?.timestamp ?? 'na'}`;
}

/** Điền replyTo / quote từ messages trong phiên khi BE/WS chỉ trả id (đủ cho tin của chính mình). */
export function enrichMessagesForDisplay(msgs) {
  const byId = new Map();
  const repliesByTargetId = new Map();
  for (const m of msgs) {
    const key = m?.id != null ? String(m.id) : null;
    if (key && !key.startsWith('tmp_')) byId.set(key, m);

    // Reply linkage can come as replyToMessageId (id only) or replyTo object (hydrated).
    const rid =
      m?.replyToMessageId != null
        ? String(m.replyToMessageId)
        : m?.replyTo?.id != null
          ? String(m.replyTo.id)
          : null;
    if (rid) {
      const list = repliesByTargetId.get(rid) ?? [];
      list.push(m);
      repliesByTargetId.set(rid, list);
    }
  }
  return msgs.map((m) => {
    let replyTo = m.replyTo;
    let quote = m.quote;

    const rid = m.replyToMessageId != null ? String(m.replyToMessageId) : null;
    if (rid && byId.has(rid)) {
      const src = byId.get(rid);
      const hasPreview =
        (replyTo && (String(replyTo.content || '').trim() !== '' || replyTo.fileUrl)) ||
        replyTo?.messageType === 'IMAGE';
      if (!hasPreview) {
        replyTo = {
          id: src.id,
          senderId: src.senderId,
          senderName: src.senderName,
          content: src.content,
          messageType: src.messageType,
          fileUrl: src.fileUrl,
        };
      }
    }

    const qid = m.quoteMessageId != null ? String(m.quoteMessageId) : null;
    if (qid && byId.has(qid)) {
      const src = byId.get(qid);
      const hasPreview =
        (quote && (String(quote.content || '').trim() !== '' || quote.fileUrl)) ||
        quote?.messageType === 'IMAGE';
      if (!hasPreview) {
        quote = {
          id: src.id,
          senderId: src.senderId,
          senderName: src.senderName,
          content: src.content,
          messageType: src.messageType,
          fileUrl: src.fileUrl,
        };
      }
    }

    // Derive deal confirmation decision from existing replies so action buttons
    // don't reappear after refresh (BE doesn't persist a "decision" field).
    let dealDecision = m.dealDecision;
    let dealResponderName = m.dealResponderName ?? null;
    if (m?.messageType === 'DEAL_CONFIRMATION' && m?.id != null && !String(m.id).startsWith('tmp_')) {
      const candidates = repliesByTargetId.get(String(m.id)) ?? [];
      if (dealDecision == null) {
        const texts = candidates
          .map((x) => (x?.content != null ? String(x.content) : ''))
          .filter((t) => t.trim() !== '');
        const joined = texts.join('\n').toLowerCase();
        if (joined) {
          if (
            joined.includes('đồng ý') ||
            joined.includes('chap nhan') ||
            joined.includes('chấp nhận') ||
            joined.includes('✅')
          ) {
            dealDecision = 'ACCEPT';
          } else if (
            joined.includes('hủy') ||
            joined.includes('huy') ||
            joined.includes('không đồng ý') ||
            joined.includes('khong dong y') ||
            joined.includes('❌')
          ) {
            dealDecision = 'CANCEL';
          } else if (candidates.length > 0) {
            dealDecision = 'DONE';
          }
        } else if (candidates.length > 0) {
          dealDecision = 'DONE';
        }
      }
      if (candidates.length > 0 && (dealDecision === 'ACCEPT' || dealDecision === 'CANCEL' || dealDecision === 'DONE')) {
        const sorted = [...candidates].sort((a, b) => {
          const ta = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tb = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
          return ta - tb;
        });
        const nm = sorted[0]?.senderName;
        if (nm && String(nm).trim()) dealResponderName = String(nm).trim();
      }
    }

    return { ...m, replyTo, quote, dealDecision, dealResponderName };
  });
}

/**
 * Với mỗi tin OFFER_PROPOSAL: true nếu sau đó (trong cùng phiên) đã có tin DEAL_CONFIRMATION chốt đơn.
 * Dùng để ẩn nút Chấp nhận/Từ chối dù offerStatus còn lệch tạm thời.
 */
export function markOfferSupersededByDealSeal(msgs) {
  if (!Array.isArray(msgs) || msgs.length === 0) return msgs;
  const n = msgs.length;
  const supersededIds = new Set();
  for (let i = 0; i < n; i += 1) {
    if (msgs[i]?.messageType !== 'OFFER_PROPOSAL' || msgs[i]?.id == null) continue;
    const idKey = String(msgs[i].id);
    if (idKey.startsWith('tmp_')) continue;
    for (let j = i + 1; j < n; j += 1) {
      const x = msgs[j];
      if (
        x?.messageType === 'DEAL_CONFIRMATION' &&
        typeof x?.content === 'string' &&
        x.content.toUpperCase().includes('XÁC NHẬN GIAO DỊCH')
      ) {
        supersededIds.add(idKey);
        break;
      }
    }
  }
  return msgs.map((m) => {
    if (m?.messageType !== 'OFFER_PROPOSAL' || m?.id == null) return m;
    const key = String(m.id);
    if (!supersededIds.has(key)) return m;
    return { ...m, offerActionsSuperseded: true };
  });
}

/** Giá trị sau `Thời gian nhận hàng:` — đổi 2026-04-03T02:11 / ISO → hiển thị vi-VN. */
export function formatDealConfirmationPickupTimeValue(rest) {
  const s = String(rest ?? '').trim();
  if (!s || s === '—') return s;
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Chuẩn hóa hiển thị tin DEAL_CONFIRMATION: giá (1.700.000 ₫) và thời gian (dd/mm/yyyy, giờ).
 */
export function formatDealConfirmationDisplayContent(content) {
  if (typeof content !== 'string') return content;
  let out = content;
  if (out.includes('Giá thỏa thuận')) {
    out = out.replace(/(^-\s*Giá thỏa thuận:\s*)(.+)$/m, (full, prefix, rest) => {
      const digits = String(rest).replace(/[^\d]/g, '');
      if (!digits) return full;
      const n = Number(digits);
      if (!Number.isFinite(n)) return full;
      return `${prefix}${n.toLocaleString('vi-VN')} ₫`;
    });
  }
  if (out.includes('Thời gian nhận hàng')) {
    out = out.replace(/(^-\s*Thời gian nhận hàng:\s*)(.+)$/m, (full, prefix, rest) => {
      const formatted = formatDealConfirmationPickupTimeValue(rest);
      return `${prefix}${formatted}`;
    });
  }
  return out;
}

