ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';

UPDATE employees
SET
  first_name = CASE
    WHEN trim(name) = '' THEN ''
    ELSE split_part(trim(name), ' ', 1)
  END,
  last_name = CASE
    WHEN trim(name) = '' THEN ''
    ELSE trim(substr(trim(name), position(' ' in trim(name)) + 1))
  END
WHERE first_name = '' AND last_name = '';

UPDATE employees
SET name = concat_ws(' ', first_name, last_name)
WHERE trim(concat_ws(' ', first_name, last_name)) <> trim(name);
