export class Failure extends Error {
    constructor(message: string, public code: string | null = null) {
        super(message);
        if (code) {
            this.code = code;
        }
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}