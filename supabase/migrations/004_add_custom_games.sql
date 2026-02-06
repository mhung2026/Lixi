-- Add custom game content columns to rooms table
-- custom_sentences: array of strings for scramble game (host-provided sentences)
-- custom_questions: JSONB array for quiz game (host-provided questions with answers)

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS custom_sentences TEXT[] DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]';
