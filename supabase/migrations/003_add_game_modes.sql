-- Add game_modes column to rooms (stores enabled game types as text array)
-- Default: just 'shake'
ALTER TABLE rooms ADD COLUMN game_modes TEXT[] NOT NULL DEFAULT ARRAY['shake'];
