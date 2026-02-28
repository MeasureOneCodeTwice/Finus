vi.mock('../src/secrets.ts');
vi.mock('../src/validation.ts');
vi.mock('../src/queries.ts');

import { vi, describe, beforeEach, afterEach, expect, it } from 'vitest';
import { login, signup } from '../src/logic';
import type { SignupBody } from '../src/types';

//mocked functions
import { validateSignupBody } from '../src/validation';
import { accountWithEmailExists, createUser, getUserByEmail } from '../src/queries';
import { hashPassword, generateJWT, passwordMatchesHash } from '../src/secrets.ts';

const resJson = vi.fn();
let res;

beforeEach(() => {
    res = {
        status: vi.fn(() => ({ json: resJson}))
    }
});

afterEach(() => {
    vi.resetAllMocks();
});

describe("Signup behaviour", () => {
    const signupBody: SignupBody = vi.fn({
        email: 'dummy email',
        password: 'dummy password',
    })

    it("Should return 201 on happy path", async () => {
        await signup(signupBody, res, undefined);
        expect(res.status).toHaveBeenCalledWith(201);
    });

    it("Should insert use into DB", async () => {
        vi.mocked(hashPassword).mockImplementation(() => "pwhash");
        await signup(signupBody, res, undefined);

        expect(createUser).toHaveBeenCalledOnce();
        const params = vi.mocked(createUser).mock.calls[0];
        expect(params[0]?.pw_hash).toEqual('pwhash');
    });

    it("Should 400 on invalid sign in body", async () => {
        vi.mocked(validateSignupBody).mockImplementation(
            () => { throw new Error() }
        );
        await signup(signupBody, res, undefined);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("Should 409 on user already existing", async () => {
        vi.mocked(accountWithEmailExists).mockImplementation(
            () => true 
        );
        await signup(signupBody, res, undefined);
        expect(res.status).toHaveBeenCalledWith(409);
    });
});

describe("Login behaviour", () => {
    const MOCK_JWT = 'JWT';
    const MOCK_USER = { pw_hash: "dummy hash"}
    beforeEach(() => {
        vi.mocked(generateJWT).mockImplementation(() => MOCK_JWT);
        vi.mocked(passwordMatchesHash).mockImplementation(() => true);
        vi.mocked(getUserByEmail).mockImplementation(() => MOCK_USER)
    });
    const loginBody = {
        email: 'email',
        password: 'password'
    };

    it("Should return JWT on Happy path", async () => {
        await login(loginBody, res, undefined);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(resJson).toHaveBeenCalledOnce();
        const params = vi.mocked(resJson).mock.calls[0];
        expect(params[0]?.token).toEqual(MOCK_JWT);
    });


    it("Should 401 on no account w/ matching email", async () => {
        vi.mocked(getUserByEmail).mockImplementation(() => { throw new Error() });
        await login(loginBody, res, undefined);
        expect(res.status).toHaveBeenCalledWith(401);
    });


    it("Should 401 on wrong password", async () => {
        vi.mocked(passwordMatchesHash).mockImplementation(() => false);
        await login(loginBody, res, undefined);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});

