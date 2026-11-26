DO $$
DECLARE
    updated_at_trigger_enabled boolean;
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_attribute
        WHERE attrelid = 'public.videos'::regclass
          AND attname = 'recorded_on' AND NOT attisdropped
    ) THEN
        RETURN;
    END IF;

    ALTER TABLE public.videos ADD COLUMN recorded_on DATE;

    SELECT tgenabled = 'O' INTO updated_at_trigger_enabled
    FROM pg_trigger
    WHERE tgrelid = 'public.videos'::regclass AND tgname = 'update_videos_updated_at';

    IF updated_at_trigger_enabled THEN
        ALTER TABLE public.videos DISABLE TRIGGER update_videos_updated_at;
    END IF;

    UPDATE public.videos
    SET recorded_on = (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')::DATE;

    IF updated_at_trigger_enabled THEN
        ALTER TABLE public.videos ENABLE TRIGGER update_videos_updated_at;
    END IF;
END;
$$;