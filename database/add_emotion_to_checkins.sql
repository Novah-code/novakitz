-- Store which pebble was chosen, not just its mood value.
--
-- checkins.mood is a 1-5 scale and several emotions share a value: anxious,
-- lonely and anger are all 2. That makes the original choice unrecoverable, so
-- the month calendar cannot colour a day the way the person actually filled it.
--
-- Rows written before this migration keep a NULL emotion and render neutral.
-- Their pebble is genuinely unknown; guessing would show someone a feeling they
-- never picked.

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS emotion TEXT;

COMMENT ON COLUMN public.checkins.emotion IS
  'Emotion key from src/lib/emotions.ts (anxious, fear, peaceful, joyful, lonely, hopeful, anger, low). NULL for rows written before 2026-08.';

CREATE INDEX IF NOT EXISTS checkins_user_emotion_idx
  ON public.checkins(user_id, check_date DESC)
  WHERE emotion IS NOT NULL;
