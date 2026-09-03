-- Oladeji: Software Engineer 2; normalize team titles to uppercase.
UPDATE employees SET job_title = 'SOFTWARE ENGINEER 2'
WHERE lower(email) LIKE 'oladejipeters%';

UPDATE employees SET job_title = 'LEAD'
WHERE lower(email) LIKE '%femiogino%';

UPDATE employees SET job_title = 'PROJECT LEAD'
WHERE lower(email) LIKE 'dotun400%';

UPDATE employees SET job_title = 'SOFTWARE ENGINEER 1'
WHERE lower(email) LIKE 'oyeniransamuel%';

UPDATE employees SET job_title = upper(trim(job_title))
WHERE trim(job_title) <> '';
