-- Custom display title for each team member (shown in the Partners/Employees list).
ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT '';

-- Ogigrid team titles and admin access
UPDATE employees SET job_title = 'Lead', role = 'Admin'
WHERE lower(email) LIKE '%femiogino%';

UPDATE employees SET job_title = 'Project Lead', role = 'Admin'
WHERE lower(email) LIKE 'dotun400%';

UPDATE employees SET job_title = 'Software Engineer 1'
WHERE lower(email) LIKE 'oyeniransamuel%';

UPDATE employees SET job_title = 'Software Engineer'
WHERE lower(email) LIKE 'oladejipeters%';
