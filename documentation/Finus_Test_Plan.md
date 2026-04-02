***Note that you can refine your testing plan as the project development goes. Keep the change log as follow:***

*Change-log*

|    Version    |  Change Date  |               By               |                     Description                     |
| :------------: | :------------: | :-----------------------------: | :-------------------------------------------------: |
| version number | Date of Change | Name of person who made changes |           Description of the changes made           |
|      1.0      |    March 2    |           Roman Tebel           |                  Initial write up                  |
|      1.1      |    March 5    |           Deep Patel           | Added more details to the scope, roles, and testing |
|      1.2      |    March 27    |              Roman              |             Updating testing procedures             |

1. # **Introduction**

   1. ## **Scope**

These are the features we have implemented for Sprint 2 and have created tests for:

1\. User Authentication

1. Sign up
2. Login
3. Logout

2\. Visualization Dashboard

1. Savings chart logic
2. Income flow chart logic
3. Budget calculation and performance against expenses
4. Lookup of transactions
5. Aggregation of snapshot data

3\. User Data Input

1. CSV parsing logic
2. Data input
3. Validating forms and files

The following are the features to be implemented in future sprints: Financial Goals, Financial Projections, Stock and FOREX Tracking, Collaborative Budgets (stretch), and ML Integration (stretch).

The scope includes functional verification through unit, integration, acceptance, and regression testing for the features implemented.

The unit and integration tests will confirm code quality and can potentially evaluate some of the project requirements. A major portion of project requirements in our case must be validated through a manual walkthrough within the client.

Load testing will be conducted in Sprint 4 in order to ensure that the server can support the expected usage load, specified in the course outline for the project.

Mutation testing will be conducted in Sprint 3 in order to expand code coverage and make the project more robust.

2. ## **Roles and Responsibilities**

Each team member is assigned one or more of the following roles:

1. Frontend Developer
2. Backend Developer
3. DevOps
4. Tester
5. Quality Assurance

| Name             | Net ID  | GitHub username     | Role                                             |
| :--------------- | :------ | :------------------ | :----------------------------------------------- |
| Roman Tebel      | 7929015 | TebelR              | Frontend Developer\+ Backend Developer \+ Tester |
| Logan Decock     | 7966258 | MeasureOneCodeTwice | Frontend Developer\+ Backend Developer \+ DevOps |
| Jackie Mei       | 7882240 | JackieMei3          | Frontend Developer\+ Backend Developer \+ QA     |
| Dylan Prabagaran | 7898220 | dyll87              | Frontend Developer\+ Backend Developer \+ Tester |
| Deep Patel       | 7957389 | deep-n-patel        | Frontend Developer\+ Backend Developer \+ Tester |
| Hoang Huy Truong | 7960938 | HuyTruong24         | Frontend Developer\+ Backend Developer \+ Tester |

**Role Details**

* Frontend Developer

  * Build and maintain the user interface of the application.
  * Connect the frontend to backend services through APIs.
  * Ensure the application is responsive and user-friendly.
  * Test and debug frontend code to maintain performance and quality.
* Backend Developer

  * Develop and maintain server-side logic and APIs.
  * Manage databases and data processing.
  * Implement security, authentication, and business logic.
  * Ensure the system is reliable, scalable, and well-tested.
* DevOps

  * Manager docker compose files, environments and secrets
  * Create and maintain CI/CD pipelines
  * Environment set up such linting and formatting as a pre-commit hooks
* Tester

  * Creates testing plans and strategies
  * Responsible for performing both manual and automated testing
  * Makes sure that the software meets the performance and quality standards
* Quality Assurance

  * Searches/Finds bugs in development & build process as well as in production.

2. # **Test Methodology**

   1. ## **Automated regression testing**

**2.1.1 Test Levels**

Test levels define the Types of Testing to be executed on the Application Under Test (AUT).  In this course, unit testing, integration testing, acceptance testing, regression testing, and load testing are mandatory.

**Requirements**:

- For unit testing, at least 10 unit tests for EACH core feature to cover the code related to each core feature.
- For integration testing, at least 10 in total to cover core features.
- Acceptance testing for each core feature. Let’s use end-user test for this. You can ask real end-user or your team members to go through each user story and see if the requirements are meet.
- For regression testing, need to execute all above unit tests \+ integration tests you have for each commit pushed to main branch.

| Test Level                    | Scope & Requirement                                                                                                                                                                            | Methodology (How will you do this?)                                                                                                                                                                        |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit Testing**        | **User Authentication:** 20 tests `<br>` **User Input:** 30 tests `<br>` **Visualization Dashboard:** 50 in Python, 46 in TypeScript `<br>` **Total:** 146 tests | *We use Vitest for TS-based microservices and the client. We use PyTest for python-based microservices.*                                                                                                 |
| **Integration Testing** | **10 tests total** covering interactions between features.                                                                                                                               | *Running tests in their environment with microservices fully operational and communicating with each other. These tests have to be executed locally as CI/CD does not have enough flexibility for this.* |
| **Acceptance Testing**  | **End-user testing** for every user story.                                                                                                                                               | *Team members/external users will perform Manual Walkthroughs based on User Story criteria. Deficiencies and potential improvements will be documented.*                                                 |
| **Regression Testing**  | Unit\+ Integration tests executed on **every push to main branch**.                                                                                                                      | *We have configured a GitHub Actions CI pipeline to run all tests automatically.*                                                                                                                        |

**2.1.2 CI/CD Regression Workflows**

On pull request to any branch github actions builds our docker images and runs our test suite. Additionally, build & test our software on any commit to a feature branch of the form feature/\*, development and main.

When a commit is pushed to a feature branch, github actions will also build and publish our docker images to docker hub, tagging the images with a release version derived from the branch name.

2. ## **Mutation Testing (Test effectiveness)**

*We used mutmut for mutation testing in our python modules: analytics and market. Separate docker files exist for mutation testing if you want to try running things locally.*

Stryker is the main supported mutation testing tool for JS and TS, but it is not supported in bun. There is a community-made plugin to enable stryker for bun, but it is in its earliest stages of development. Stryker executes, but can't gather coverage from tests in bun, so it appears as if no mutants are getting killed no matter what is done in unit tests.

We attempted to run stryker with vitest in node, but this results in a lot of library conflicts and version mismatches as bun and node use the same exact configuration and organization files for packages.

3. ## **Load Testing**

We use a `k6` load test located at `app/server/load-tests/api-gateway-capacity.js` to validate the course capacity requirement:

- **20 concurrent users**
- **200 total requests per minute**

The script enforces this by running **20 virtual users** concurrently and having each one issue **10 authenticated requests per minute** after signing up, logging in, and creating a test account. This exercises the gateway, auth service, user service, and database together under sustained load.

This load test is **not required to be part of the CI/CD pipeline** and can be run manually with Docker when needed.

```bash
cd app/server
docker compose -f docker-compose.yml -f docker-compose.test.yml up load-test --abort-on-container-failure
```

The test fails if request failures rise above 1% or if fewer than 99% of checks pass.

3. # **Terms/Acronyms**

Make a mention of any terms or acronyms used in the project

| TERM/ACRONYM | DEFINITION                    |
| :----------- | :---------------------------- |
| API          | Application Program Interface |
| AUT          | Application Under Test        |
| JWT          | JSON Web Token                |
