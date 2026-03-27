import request from "supertest";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createSignupBody(prefix: string) {
  const safePrefix = prefix.replace(/[^\w]/g, "");
  const unique = `${safePrefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  return {
    username: unique,
    email: `${unique}@example.com`,
    first_name: "Test",
    last_name: "User",
    age: 30,
    password: "123ABC!7",
  };
}

export async function createAuthenticatedAccount(
  baseUrl: string,
  prefix: string,
  accountOverrides?: {
    name?: string;
    type?: string;
    balance?: number;
    value?: number;
    subtype?: string;
  },
) {
  const deadline = Date.now() + 20000;
  let lastFailure = "setup did not start";

  while (Date.now() < deadline) {
    const signupBody = createSignupBody(prefix);

    try {
      const signup = await request(baseUrl)
        .post("/api/signup")
        .send(signupBody);
      if (signup.status !== 201) {
        lastFailure = `signup=${signup.status} ${JSON.stringify(signup.body)}`;
        await sleep(500);
        continue;
      }

      const login = await request(baseUrl)
        .post("/api/login")
        .send({ email: signupBody.email, password: signupBody.password });
      if (login.status !== 200 || !login.body.token) {
        lastFailure = `login=${login.status} ${JSON.stringify(login.body)}`;
        await sleep(500);
        continue;
      }

      const token = login.body.token as string;

      // Create the account
      const account = await request(baseUrl)
        .post("/api/accounts")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: accountOverrides?.name ?? "Chequing",
          type: accountOverrides?.type ?? "chequing",
          balance: accountOverrides?.balance ?? 1000,
          value: accountOverrides?.value ?? 1000,
          subtype: accountOverrides?.subtype ?? "na",
        });

      console.log("Account creation response:", account.status, account.body);

      if (account.status !== 200 || !account.body.id) {
        lastFailure = `account=${account.status} ${JSON.stringify(account.body)}`;
        await sleep(500);
        continue;
      }

      return {
        token,
        accountId: account.body.id as number,
      };
    } catch (error) {
      lastFailure =
        error instanceof Error ? error.message : "unknown setup error";
      console.log("Setup error:", lastFailure);
      await sleep(500);
    }
  }

  throw new Error(`Timed out creating authenticated account: ${lastFailure}`);
}

export interface GoalData {
  name: string;
  type: "save" | "reduce_spending";
  category: string;
  target: number;
  period?: "w" | "m";
}

export async function createGoal(
  baseUrl: string,
  token: string,
  goalData: GoalData,
) {
  const response = await request(baseUrl)
    .post("/goals")
    .set("Authorization", `Bearer ${token}`)
    .send(goalData);

  if (response.status !== 201) {
    throw new Error(
      `Failed to create goal: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return response.body;
}

export async function createMultipleGoals(
  baseUrl: string,
  token: string,
  goalsData: GoalData[],
) {
  const createdGoals = [];
  for (const goalData of goalsData) {
    const goal = await createGoal(baseUrl, token, goalData);
    createdGoals.push(goal);
  }
  return createdGoals;
}

export async function deleteAllGoals(baseUrl: string, token: string) {
  // Fetch all goals
  const listRes = await request(baseUrl)
    .get("/goals")
    .set("Authorization", `Bearer ${token}`);

  if (listRes.status === 200 && Array.isArray(listRes.body)) {
    // Delete each goal
    for (const goal of listRes.body) {
      await request(baseUrl)
        .delete(`/goals?gid=${goal.id}`)
        .set("Authorization", `Bearer ${token}`);
    }
  }
}

export async function setupUserWithGoals(
  baseUrl: string,
  prefix: string,
  goalsData: GoalData[],
) {
  // First create the user account
  const { token } = await createAuthenticatedAccount(baseUrl, prefix, {
    name: "Test Account",
    type: "chequing",
    balance: 5000,
    value: 5000,
    subtype: "na",
  });

  // Clean up any existing goals (in case of leftover data)
  await deleteAllGoals(baseUrl, token);

  // Create the specified goals
  const createdGoals = await createMultipleGoals(baseUrl, token, goalsData);

  return {
    token,
    goals: createdGoals,
    deleteAllGoals: () => deleteAllGoals(baseUrl, token),
  };
}
