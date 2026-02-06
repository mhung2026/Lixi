-- Add MoMo phone number to players for quick transfer
ALTER TABLE players ADD COLUMN phone VARCHAR(15) DEFAULT NULL;

-- Add MoMo phone to rooms (host's MoMo for reference)
ALTER TABLE rooms ADD COLUMN host_phone VARCHAR(15) DEFAULT NULL;
