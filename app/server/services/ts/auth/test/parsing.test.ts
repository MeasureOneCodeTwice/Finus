import { describe, expect, it, beforeEach } from "vitest";
import { parseLoginBody, parseSignupBody } from "../src/parsing.ts";

let signupBody;
let loginBody;
beforeEach(() => {
  signupBody = {
    username: "username",
    email: "e@ma.il",
    first_name: "first_name",
    last_name: "last_name",
    age: "21",
    password: "Password123123",
  };

  loginBody = {
    email: "e@ma.il",
    password: "password",
  };
});

describe("loginBody tests", () => {
  it("Should accept a valid signupBody", () => {
    parseSignupBody(signupBody);
  });

  it("Should throw on non-numeric ages", () => {
    signupBody.age = "aoue";
    expect(() => parseSignupBody(signupBody)).toThrowError();
  });

  it("Should only accept integer ages", () => {
    signupBody.age = "21.253";
    expect(() => parseSignupBody(signupBody)).toThrowError();
  });

  it("Should throw on missing field", () => {
    delete signupBody.username;
    expect(() => parseSignupBody(signupBody)).toThrowError();
  });
});

describe("loginBody tests", () => {
  it("Should lowercase email", () => {
    loginBody.email = "EMAIL@MAIL.COM";
    const parsed = parseLoginBody(loginBody);

    expect(parsed.email).toEqual(loginBody.email.toLowerCase());
  });

  it("Should trim email", () => {
    loginBody.email = " email@mail.com    ";
    const parsed = parseLoginBody(loginBody);

    expect(parsed.email).toEqual(loginBody.email.trim());
  });

  it("Should throw on invalid email", () => {
    loginBody.email = "abc";
    expect(() => parseLoginBody(loginBody)).toThrow();
  });
});
