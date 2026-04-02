### General Map

To follow our application's code, we have divided everything into client and server directories. Client is done in TS with Bun and VIte as its framework. Server consists of microservices in both TS and Python. The database is also located in the server as a separate microservice.

### Client

At app -> client you will see all the general directories and files that are used to build up the client. 

At client -> test you will find some unit tests for more complex logic and functionality. These were made as an extra precaution even though it was assumed that we did not need them for our grading.

Within the client directory, you will find standard bun package and organizational files, as well as all of our setup for Docker. The standard Dockerfile and coker-compose.yml do not run tests and are the typical way to launch the client container. Docker files with the ".test" suffix run client-side unit tests.

In client -> src you will find all of the client source code, including various directories. The App.tsx file contains some of the first few authentication steps that would be typically seen by a user. This authentication shell wrapps the entirety of the code beyond.

In src -> api you will find our API managers for various features. Some of these are more functional than others and contain a mixture of methods that would be typically called from a single page instead of just one feature. They all generally follow the structure of using an axios instance from the config.ts file, which appends JWT to every request sent to the server. You will find that all methods handle errors from the response gracefully.

In src -> components you will find the multitude of components utilized throughout the pages, as well as some separation for CSV reading components, market page components, and some more general ui, which is a remnant of our project's initial stages where we tried to use shadcn/ui components. Most components end up containing a lot of HTML within them and they can get very complex. You will find comments throughtout the code whenever chunks of code must be explained. We did not spend time commenting on self-explanatory, simple functions.

In src -> enum you will find some enumerator types to assist with account and transaction logic for user data input feature.

In src -> hooks you will find a single hook for loading in a simple snapshot of user performance in the main dashboard page.

All of our 5 pages can be found in src -> pages. These are primarily for layout and style and they host a lot of components internally.

In src -> type you will find all the types that are being used to pass data around the client.

The src -> utils directory contains all of our helper methods ranging from data validation to formatting.


### Server

This section focuses on everything that can be found in app -> server. Inside the server directory, you will see the same setup of docker-compose files - one for regular deployment and one for running test containers.

In server -> services you should find the 3 categories for microservices: TS, Python and the database.

#### Database

services -> database contains everything related to our MySQL DB. We access the database from outside of its container, so we user a non-root user account that needs extra privileges to contact the db. The populator python script, which can be ran with "python populator.py --clear", as an example, can be used to cleanup and repopulate the databse with randomized data. Our schema can also be found in this directory.

#### Python

In services -> python you will find the directories for our analytics and market services. Python naming of variables and methods uses the Python's standard snake case.

The analytics service is the most complex out of the two, so its source code has been separated into logic, models, queries and utils. The main file, which exists outisde of those directories, contains the handling of redirects and it invokes all the logic code, which then invokes the queries. 

In addition to the rest of the source code for analytics, you can find the test directory, whcih contains unit and integration tests and coverage reports from pytest. Integration tests for all our services can only be ran locally, as they rely on the database being active, which is something that GitHub actions is not flexible enough to support.

The market service is simpler, as it relies on an external API. All of its source code is found int its own src directory under python -> market -> src. In the market service, you will find the similar unit tests, but also integration tests separated within the integration directory. Unlike other services, market does not rely on the DB, so its integration test can run whenever, even in the CI/CD pipeline.

#### TypeScript

Inside the server -> services -> ts directory, you will find all of our TS services: api-gateway, auth and user. We use camel case for all TS naming.

The auth services is simple in its functionality, so all of its code exsits within auth -> src directory. The files are labeled according to what they contain.

The api gateway service is the most simple, as it just serves as a redirect for all API calls. It only has an index file as its source code, but that is really all it needs.

The user microservice is meant to handle all API calls regarding simple data retrieval and processing tasks. It's code has been divided into logic, queries, routes, types and utils. Rerouting and logic invocation is happening in the index file.
