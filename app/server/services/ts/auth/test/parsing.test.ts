import { describe, expect, it, beforeEach } from 'vitest';
import { parseLoginBody, parseSignupBody } from '../src/parsing.ts';

let signupBody;
let loginBody;
beforeEach(() => {
    signupBody = {
        username:   'username',
        email:      'email',
        first_name: 'first_name',
        last_name:  'last_name',
        age:        '21',
        password:   'password',
    };

    loginBody = {
        email:      'email',
        password:   'password',
    };
});

describe("loginBody tests", () => {
    it("Should throw on non-numeric ages", () => {
        loginBody.age = "twenty one";
        expect(() => parseSignupBody(signupBody)).toThrowError();
    });

    it("Should only accept integer ages", () => {
        loginBody.age = 21.25;
        expect(() => parseSignupBody(signupBody)).toThrowError();
    });

    it("Should throw on missing field", () => {
        delete loginBody.username;
        expect(() => parseSignupBody(signupBody)).toThrowError();
    });
});


describe("loginBody tests", () => {
    it("Should lowercase email", () => {
        loginBody.email = 'EMAIL@MAIL.COM';
        const parsed = parseLoginBody(loginBody);

        expect(parsed.email).toEqual(loginBody.email.toLowerCase());
    });

    it("Should trim email", () => {
        loginBody.email = ' email@mail.com    ';
        const parsed = parseLoginBody(loginBody);

        expect(parsed.email).toEqual(loginBody.email.trim());
    });

});


