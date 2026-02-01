export class Admin {
    constructor(
        public readonly adminID: string,
        public readonly username: string,
        public readonly passwordHash: string,
        public readonly name: string,
        public readonly createdAt: Date,
        public readonly mustChangePassword: boolean = false
    ) {}
}
