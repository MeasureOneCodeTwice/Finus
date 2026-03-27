export class BadRequestError extends Error {
    constructor(message: string) {
        super(message); 
        this.name = "UnauthorizedAccessError"; 
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}