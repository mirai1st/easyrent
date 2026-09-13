ALTER TABLE Rent
    ADD COLUMN target_institution varchar(255) NULL AFTER location;

-- Backfill existing rows manually when the correct institution is known.
-- Example:
-- UPDATE Rent
-- SET target_institution = 'Politeknik Balik Pulau, Pulau Pinang'
-- WHERE location LIKE '%Pulau Pinang%';