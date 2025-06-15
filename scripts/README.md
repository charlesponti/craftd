# Job Applications Data Injection Script

This script imports job application data from the `job-applications.csv` file into your database.

## Prerequisites

1. Ensure your database is running and migrated:
   ```bash
   npm run db:up
   npm run db:migrate
   ```

2. Update the script with your actual user information in `scripts/inject-job-applications.ts`:
   ```typescript
   // Replace these values with your actual information
   where: eq(schema.users.email, 'your-email@example.com') // Replace with your actual email
   
   // And in the user creation section:
   email: 'your-email@example.com', // Replace with your actual email
   name: 'Your Name', // Replace with your actual name
   ```

## Usage

Run the injection script:

```bash
# Using npm script
npm run db:inject-jobs

# Or directly with bun
bun run scripts/inject-job-applications.ts
```

## What the script does

1. **Parses the CSV file**: Reads and parses `job-applications.csv` from the project root
2. **Creates/finds user**: Creates a user account or uses existing one based on email
3. **Processes companies**: Extracts company names from the CSV and creates company records
4. **Creates job applications**: Converts CSV data into structured job application records

## Data mapping

The script maps CSV fields to database fields as follows:

- **Position** → `position`
- **Company** → Creates company record and links via `companyId`
- **status** → `status` (mapped to standard values like 'APPLIED', 'REJECTED', etc.)
- **date** → `applicationDate` and `startDate`
- **end_date** → `endDate`
- **location** → `location`
- **job_posting** → `jobPosting` and `source` detection
- **salary_quoted** → `salaryQuoted` and `salaryOffered`
- **salary_accepted** → `salaryAccepted` and `salaryFinal`
- **Reference** → `reference` (boolean)
- **stages** → `stages` (structured array)
- **phone_screen** → `interviewDates` (structured array)

## Status mapping

CSV status values are mapped to database enum values:

- `Application` / `application` → `APPLIED`
- `Rejected` → `REJECTED`
- `Withdrew` → `WITHDRAWN`
- `Hired` → `ACCEPTED`
- `phone screen` → `PHONE_SCREEN`
- `interview` → `INTERVIEW`
- `offer` → `OFFER`

## Error handling

- The script will skip rows with missing Position or Company data
- Individual row errors won't stop the entire process
- A summary is shown at the end with counts of created/skipped records

## Output

The script provides detailed console output including:
- Progress indicators for each company and application created
- Error messages for any failed records
- Final summary with counts of companies created, applications created, and applications skipped
