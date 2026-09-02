# Smart Resume Matcher - Review 2 Presentation Content

Copy this content into the supplied CMRIT template. Replace every item in
square brackets with your actual details before presenting.

## Slide 1 - Title Slide

**Smart Resume Matcher: An Explainable Candidate-Job Matching Platform**

BCS786 - Major Project Phase II  
Review - 2

Submitted by  
[1CR23CS079] - [Jatin Verma]  
[1CR23CS196] - [Supreme Sharma]

Under the guidance of  
[Sawmya], [Designation]

Date: 3-09-2026

## Slide 2 - Outline

- Problem Statement
- Objectives
- Novelty of the Proposed System
- Base Paper - Journal Reference
- Progress After Review 1
- System Architecture and Data Description
- Proposed Methodology and Intermediate Results
- Conclusion and Future Enhancements

## Slide 3 - Problem Statement

- Recruiters receive many resumes for each opening, making manual screening slow and inconsistent.
- Candidates often cannot understand how well their resume fits a job or which skills are missing.
- Existing job portals usually show listings, but do not provide a transparent skill-level explanation of the match.
- The proposed system provides a role-based platform that parses resumes, extracts relevant skills, calculates an explainable match score, and supports application tracking.

## Slide 4 - Objectives

1. Build a secure role-based web platform for candidates and recruiters.
2. Extract skills from uploaded resume documents and store a structured candidate profile.
3. Compare resume skills with required and preferred job skills using a transparent weighted score.
4. Support job posting, application submission, applicant ranking, and application-status tracking.

## Slide 5 - Novelty of Proposed System

- **Explainable matching:** The system shows matched and missing required/preferred skills, not only a final percentage.
- **Weighted recruitment score:** Required skills contribute 70% and preferred skills contribute 30% of the match score.
- **Two-sided workflow:** Candidates upload resumes and apply; recruiters create jobs, review ranked applicants, and update hiring stages.
- **Practical document pipeline:** The backend extracts text from PDF and DOCX resumes and maps it to a curated skill dictionary.
- **Prototype focus:** The current version uses deterministic, rule-based matching for transparency; semantic NLP/ML matching is planned as future work.

## Slide 6 - Base Paper (Journal Only)

**Base paper**

D. C. Ertugrul and S. Bitirim, "Job recommender systems: a systematic literature review, applications, open issues, and challenges," *Journal of Big Data*, vol. 12, art. no. 140, 2025, doi: 10.1186/s40537-025-01173-y.

**Relevance to our project**

- The paper identifies candidate-job matching as a major application of job recommender systems.
- It discusses content-based, collaborative, hybrid, and knowledge-based matching approaches.
- Our project implements an initial transparent content/knowledge-based skill matching workflow.
- The paper motivates future additions such as semantic similarity, bias-aware evaluation, and richer recommendation models.

> If your guide has already approved a different journal paper, replace this slide and the first reference with that approved paper.

## Slide 7 - Progress After Review 1

**Verified implementation progress**

- Finalized MongoDB schemas for users, jobs, resumes, and applications.
- Implemented JWT authentication and role-based access control for candidates and recruiters.
- Implemented recruiter job creation, open-job listing, applicant viewing, ranking, and status updates.
- Implemented candidate resume upload, skill extraction, job discovery, match calculation, and application tracking.
- Implemented candidate and recruiter dashboards with application statistics.
- Verified that the React client produces a successful production build.

**Review 1 feedback addressed**

- [Replace this line with the actual first comment received in Review 1 and the action taken.]
- [Replace this line with the actual second comment received in Review 1 and the action taken.]

## Slide 8 - System Architecture

Use a block diagram with the following flow:

**Candidate / Recruiter**
→ **React 19 + Vite Client**
→ **Express.js REST API**
→ **MongoDB Database**

Inside the REST API, show these services:

1. **Authentication and RBAC** - Registration, login, JWT verification, candidate/recruiter authorization.
2. **Resume Processing** - File upload → PDF/DOCX text extraction → skill dictionary lookup.
3. **Job and Application Management** - Job creation, job search, apply, applicant-status updates.
4. **Matching Engine** - Skill normalization → required/preferred comparison → weighted match score.

Suggested labels below the blocks:

- Client: React, Vite, Tailwind CSS
- API: Node.js, Express.js, Multer, PDFParse, Mammoth
- Database: MongoDB, Mongoose

## Slide 9 - Dataset / Operational Data Description

**Data source**

- The current project is a functional, rule-based prototype; it does not train a machine-learning model on a public dataset.
- Operational data is created through candidate-uploaded sample resumes and recruiter-created job postings during functional testing.

**Current records for demonstration**

- Resume records: [Enter the number of sample resumes you created]
- Job records: [Enter the number of sample job postings you created]
- Application records: [Enter the number of applications you created]

**Key data fields and significance**

| Entity | Important fields | Use in the system |
|---|---|---|
| Resume | parsed text, detected skills, file type | Creates the candidate skill profile |
| Job | title, description, required skills, preferred skills | Defines the matching criteria |
| Application | candidate, job, resume, score, status | Tracks the recruitment outcome |

**Important note for the review:** Do not claim a large dataset or ML accuracy metric unless you have actually collected the data and evaluated it.

## Slide 10 - Proposed Methodology

Draw five connected blocks:

**1. User and Job Management**
→ **2. Resume Upload and Text Extraction**
→ **3. Skill Extraction and Normalization**
→ **4. Weighted Matching Engine**
→ **5. Application Tracking and Recruiter Analytics**

Caption: *The system converts semi-structured resume text into a structured skill profile and compares it with job requirements in an explainable workflow.*

## Slide 11 - Module 1: User and Job Management

**Input**

- Candidate/recruiter registration details and recruiter job-posting details.

**Process**

- Password hashing and JWT-based login.
- Role-based authorization separates candidate and recruiter actions.
- Recruiters create jobs with required skills, preferred skills, location, employment type, and status.

**Output**

- Authenticated user session and structured job records available for discovery and matching.

## Slide 12 - Module 2: Resume Upload and Text Extraction

**Input**

- Candidate resume document in PDF or DOCX format.

**Process**

- Multer receives the file on the server.
- PDFParse extracts text from PDF files; Mammoth extracts raw text from DOCX files.
- The extracted text is stored with the resume record.

**Output**

- Clean resume text passed to the skill-extraction module.

## Slide 13 - Module 3: Skill Extraction and Normalization

**Input**

- Extracted resume text.

**Process**

- Convert text to lowercase and normalize punctuation/spacing.
- Match aliases against a curated skill dictionary.
- Store skills with categories such as programming, frontend, backend, database, AI, DevOps, and security.

**Output**

- Structured skill list, for example: JavaScript, React, Node.js, MongoDB, Git.

## Slide 14 - Module 4: Weighted Matching Engine

**Input**

- Candidate skill set, required job skills, and preferred job skills.

**Process**

- Normalize all skill names before comparison.
- Calculate required-skill coverage and preferred-skill coverage.
- Produce matched skills, missing skills, and the final score.

**Equations**

`Required coverage = Matched required skills / Total required skills`

`Preferred coverage = Matched preferred skills / Total preferred skills`

`Match score (%) = [0.70 × Required coverage + 0.30 × Preferred coverage] × 100`

**Output**

- Explainable score with matched/missing required and preferred skills.

## Slide 15 - Module 5: Applications and Recruiter Analytics

**Input**

- Candidate application with the selected resume and calculated score.

**Process**

- Enforce one application per candidate per job.
- Store the score and detailed match analysis with the application.
- Sort applicants by score for each recruiter job.
- Allow application-status updates: Applied, Shortlisted, Interview, Rejected, or Hired.

**Output**

- Candidate application timeline and recruiter dashboard statistics.

## Slide 16 - Intermediate Output Screenshots

Use actual screenshots from your running application in this sequence:

1. **Candidate dashboard** - dashboard with resume and application summary.
2. **Resume upload / detected skills** - uploaded resume with extracted skill tags.
3. **Job details and match result** - selected resume, match percentage, and missing skills.
4. **Recruiter applicant management** - ranked applicants and application-status controls.

Caption below the screenshots:

`Resume upload → text/skill extraction → job-resume match → application and recruiter decision workflow`

## Slide 17 - Conclusion and Future Enhancements

**Conclusion**

- Smart Resume Matcher demonstrates an end-to-end recruitment workflow for candidates and recruiters.
- It transforms resumes into structured skills and generates an understandable, weighted job-match score.
- The implemented prototype supports job posting, candidate applications, applicant ranking, and recruitment status tracking.

**Future enhancements**

- Add semantic NLP/embedding-based matching to recognize related skills beyond exact dictionary matches.
- Add authenticated private file storage, stronger upload validation, and job-deadline enforcement.
- Add job editing/deletion, notifications, pagination, and automated tests.
- Evaluate with a larger approved dataset using precision, recall, F1-score, and ranking metrics.

## Slide 18 - References

[1] D. C. Ertugrul and S. Bitirim, "Job recommender systems: a systematic literature review, applications, open issues, and challenges," *Journal of Big Data*, vol. 12, art. no. 140, 2025, doi: 10.1186/s40537-025-01173-y.

[2] [Add any additional journal paper approved by your guide in IEEE format.]

---

## Presentation reminders

- Keep the original template's header/footer and logos.
- For Slide 8, retain your Review 1 architecture slide if it already matches the above implementation.
- For Slide 9, enter only the test-record counts you have actually created.
- Keep the five methodology module slides; the supplied template explicitly asks for one slide per block.
- Use actual application screenshots, not placeholders, on Slide 16.
