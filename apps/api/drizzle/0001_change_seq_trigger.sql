-- Bumps change_seq and version on every update of a syncable entity (BACKLOG §9, "Офлайн и синхронизация").
-- Attach per table: CREATE TRIGGER <table>_change_seq BEFORE UPDATE ON <table>
--                   FOR EACH ROW EXECUTE FUNCTION set_change_seq();
CREATE OR REPLACE FUNCTION set_change_seq() RETURNS trigger AS $$
BEGIN
  NEW.change_seq := nextval('change_seq');
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
