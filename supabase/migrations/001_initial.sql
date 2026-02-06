-- Sum Vầy - Lắc Lộc Đầu Xuân 2026
-- Initial database schema

-- Enum types
CREATE TYPE room_mode AS ENUM ('online', 'local');
CREATE TYPE room_status AS ENUM ('waiting', 'active', 'ended');
CREATE TYPE prize_type AS ENUM ('cash', 'item');

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_name VARCHAR(100) NOT NULL,
  mode room_mode NOT NULL DEFAULT 'online',
  max_shakes INT NOT NULL DEFAULT 1,
  status room_status NOT NULL DEFAULT 'active',
  host_phone VARCHAR(15) DEFAULT NULL,
  game_modes TEXT[] NOT NULL DEFAULT ARRAY['shake'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prizes table
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type prize_type NOT NULL DEFAULT 'cash',
  name VARCHAR(200) NOT NULL,
  value INT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  remaining INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) DEFAULT NULL,
  shakes_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Results table
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prizes_room_id ON prizes(room_id);
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_results_room_id ON results(room_id);
CREATE INDEX idx_rooms_code ON rooms(code);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anonymous users (game doesn't require auth)
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prizes" ON prizes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on results" ON results FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE prizes;
ALTER PUBLICATION supabase_realtime ADD TABLE results;

-- RPC Function: Atomic prize claim (prevent race conditions)
CREATE OR REPLACE FUNCTION claim_prize(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_prize prizes%ROWTYPE;
  v_result results%ROWTYPE;
  v_room rooms%ROWTYPE;
  v_player players%ROWTYPE;
  v_shakes_used INT;
BEGIN
  -- Get room info
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Phòng không tồn tại');
  END IF;

  IF v_room.status = 'ended' THEN
    RETURN json_build_object('success', false, 'error', 'Phòng đã kết thúc');
  END IF;

  -- Get player info
  SELECT * INTO v_player FROM players WHERE id = p_player_id AND room_id = p_room_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Người chơi không tồn tại');
  END IF;

  -- Check shake limit
  IF v_player.shakes_used >= v_room.max_shakes THEN
    RETURN json_build_object('success', false, 'error', 'Bạn đã hết lượt lắc');
  END IF;

  -- Pick a random prize with remaining > 0 (with row lock)
  SELECT * INTO v_prize
  FROM prizes
  WHERE room_id = p_room_id AND remaining > 0
  ORDER BY random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Hết lộc rồi! Tất cả giải đã được phát hết');
  END IF;

  -- Decrement remaining
  UPDATE prizes SET remaining = remaining - 1 WHERE id = v_prize.id;

  -- Increment player shakes_used
  UPDATE players SET shakes_used = shakes_used + 1 WHERE id = p_player_id;

  -- Insert result
  INSERT INTO results (room_id, player_id, prize_id)
  VALUES (p_room_id, p_player_id, v_prize.id)
  RETURNING * INTO v_result;

  -- Return success with prize info
  RETURN json_build_object(
    'success', true,
    'prize', json_build_object(
      'id', v_prize.id,
      'type', v_prize.type,
      'name', v_prize.name,
      'value', v_prize.value
    ),
    'result_id', v_result.id
  );
END;
$$;
