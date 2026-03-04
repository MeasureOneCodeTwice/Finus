import { vi, describe, expect, it, beforeEach } from "vitest";
import { validateSignupBody } from "../src/validation";
import type { SignupBody } from "../src/types";

vi.mock("../src/config.ts", () => ({
  MIN_PASSWORD_LENGTH: 8,
  MIN_AGE: 12,
  MAX_AGE: 100,
}));

let signupBody: SignupBody;
beforeEach(() => {
  signupBody = {
    email: "testemail@domain.com",
    password: "PASSWORPASSWORDDPASSWORD123!@#",
    age: 15,
  };
});

describe("Happy path", () => {
  it("Should accept a valid signupBody", () => {
    validateSignupBody(signupBody);
  });
});

describe("Age validation tests", () => {
  it("should reject ages below the minimum", () => {
    signupBody.age = 11;
    expect(() => validateSignupBody(signupBody)).toThrowError();
  });

  it("should reject above below the maximum", () => {
    signupBody.age = 101;
    expect(() => validateSignupBody(signupBody)).toThrowError();
  });
});

describe("Password validation tests", () => {
  it("should reject passwords that are too short", () => {
    signupBody.password = "PA12";
    expect(() => validateSignupBody(signupBody)).toThrowError();
  });

  it("should reject passwords that have no letters", () => {
    signupBody.password = "11111111111";
    expect(() => validateSignupBody(signupBody)).toThrowError();
  });

  it("should reject passwords that have no digits", () => {
    signupBody.password = "aaaaaaaaaaa";
    expect(() => validateSignupBody(signupBody)).toThrowError();
  });
});
