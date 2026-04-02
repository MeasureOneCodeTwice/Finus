/* 
  Load testing script

  It is designed to be run either:
  1. through Docker using the command from app/server: 
      docker compose -f docker-compose.yml -f docker-compose.test.yml up load-test --abort-on-container-failure.
  2. Using k6 which needs to be installed first then run with from app/server/load-tests:
      k6.exe run api-gateway-capacity.js

  Performance targets:    
  20 concurrent users, each sending 10 requests per minute.
  20 users * 10 requests/minute = 200 requests/minute total. 
  
  */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const CONCURRENT_USERS = Number(__ENV.LOAD_TEST_USERS || 20);
const REQUESTS_PER_USER_PER_MINUTE = Number(
  __ENV.REQUESTS_PER_USER_PER_MINUTE || 10,
);
const TEST_DURATION = __ENV.LOAD_TEST_DURATION || "2m";
const API_BASE_URL = __ENV.LOAD_TEST_BASE_URL || "http://localhost:3000";
const EMAIL_RUN_ID = __ENV.LOAD_TEST_RUN_ID || Date.now().toString();

// Each iteration sends exactly one authenticated request, so sleeping for
// 60 / 10 = 6 seconds keeps one user at 10 requests per minute.
const REQUEST_INTERVAL_SECONDS = 60 / REQUESTS_PER_USER_PER_MINUTE;

// Count successful business requests so the summary clearly shows whether
// the server handled the intended request volume successfully.
const successfulRequests = new Counter("successful_requests");

export const options = {
  scenarios: {
    capacity_requirement: {
      executor: "constant-vus",
      vus: CONCURRENT_USERS,
      duration: TEST_DURATION,
    },
  },
  thresholds: {
    // The capacity test should be stable; failures indicate the system
    // cannot reliably sustain the configured user/request volume.
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "max"],
};

let authToken;
let accountId;
let transactionSequence = 0;

function buildUserIdentity(userNumber) {
  const suffix = `${EMAIL_RUN_ID}_${userNumber}`;
  return {
    username: `load_user_${suffix}`,
    email: `load_user_${suffix}@finus.test`,
    password: "LoadTestPass123!",
    first_name: "Load",
    last_name: `User${userNumber}`,
    age: 30,
  };
}

function signupAndLoginForUser(userNumber) {
  const user = buildUserIdentity(userNumber);

  // Signup provisions a real user/profile pair in the database so each
  // user exercises the same auth and persistence flow as production.
  const signupResponse = http.post(
    `${API_BASE_URL}/api/signup`,
    JSON.stringify(user),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "signup" },
    },
  );

  // Re-runs should still work if the same run id is reused and the account
  // already exists, so we accept the duplicate-account response as setup-safe.
  check(signupResponse, {
    "signup succeeded or already existed": (response) =>
      response.status === 201 || response.status === 409,
  });

  const loginResponse = http.post(
    `${API_BASE_URL}/api/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "login" },
    },
  );

  check(loginResponse, {
    "login returned token": (response) =>
      response.status === 200 && Boolean(response.json("token")),
  });

  authToken = loginResponse.json("token");
}

function createAccountForUser(userNumber) {
  // Each user creates one account once so read endpoints have
  // meaningful user-owned data to query during the steady-state load.
  const accountResponse = http.post(
    `${API_BASE_URL}/api/accounts`,
    JSON.stringify({
      id: 0,
      name: `Load Checking ${EMAIL_RUN_ID}_${userNumber}`,
      type: "CHEQUING",
      balance: 1000,
      value: 1000,
      last_updated: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      tags: { endpoint: "create_account" },
    },
  );

  check(accountResponse, {
    "account created": (response) =>
      response.status === 200 || response.status === 201,
  });

  accountId = accountResponse.json("id");
}

function createTransactionForUser(userNumber) {
  transactionSequence += 1;

  const transactionResponse = http.post(
    `${API_BASE_URL}/api/transactions`,
    JSON.stringify({
      id: 0,
      financialAccount_id: accountId,
      amount: 25 + transactionSequence,
      description: `Load test transaction ${transactionSequence}`,
      sender: `Employer_${userNumber}`,
      recipient: `Load_User_${userNumber}`,
      date: new Date().toISOString(),
      category: "INCOME",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      tags: { endpoint: "create_transaction" },
    },
  );

  const requestPassed = check(transactionResponse, {
    "transaction created": (response) =>
      response.status === 200 || response.status === 201,
  });

  if (requestPassed) {
    successfulRequests.add(1);
  }
}

function ensureUserIsInitialized() {
  if (authToken && accountId) {
    return;
  }

  const userNumber = __VU;
  signupAndLoginForUser(userNumber);
  createAccountForUser(userNumber);
  createTransactionForUser(userNumber);
}

function authenticatedGet(path, endpointTag) {
  const response = http.get(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    tags: { endpoint: endpointTag },
  });

  const requestPassed = check(response, {
    [`${endpointTag} returned 200`]: (res) => res.status === 200,
  });

  if (requestPassed) {
    successfulRequests.add(1);
  }

  return response;
}

export default function () {
  ensureUserIsInitialized();

  // Rotate endpoints so the load is spread across the gateway and the user
  // service instead of repeatedly hitting a single route.
  const routeIndex = __ITER % 3;
  if (routeIndex === 0) {
    authenticatedGet("/api/accounts", "accounts_list");
  } else if (routeIndex === 1) {
    authenticatedGet(
      `/api/transactions?financialAccount_id=${accountId}`,
      "transaction_list",
    );
  } else {
    createTransactionForUser(__VU);
  }

  sleep(REQUEST_INTERVAL_SECONDS);
}
