
-- logical replication을 위해 필요
ALTER SYSTEM SET wal_level = 'logical';

-- wal을 읽어들일 수 있는 외부 시스템 최대 개수
ALTER SYSTEM SET max_replication_slots = 4;

-- wal process 개수
ALTER SYSTEM SET max_wal_senders = 4;