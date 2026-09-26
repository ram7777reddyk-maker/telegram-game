CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    max_players INTEGER NOT NULL DEFAULT 6,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS room_players (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(room_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_id
ON rooms(room_id);

CREATE INDEX IF NOT EXISTS idx_room_players_room_id
ON room_players(room_id);

CREATE INDEX IF NOT EXISTS idx_room_players_player_id
ON room_players(player_id);
