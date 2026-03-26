-- Xóa toàn bộ lịch sử chat để Bob có thể tự tìm Alice và bắt đầu nhắn tin mới.
-- Database: slife_db (localhost)
--
-- Cách chạy (từ thư mục backend):
--   mysql -u root -p slife_db < scripts/clear_chat_history.sql
-- Hoặc mở MySQL Workbench / DBeaver, chọn DB slife_db rồi chạy nội dung file này.

START TRANSACTION;

DELETE FROM messages;
DELETE FROM deals;
DELETE FROM reviews;
DELETE FROM conversations;

COMMIT;
