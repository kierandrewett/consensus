import "fastify";

declare module "fastify" {
    interface Session {
        voterID?: string;
        voterName?: string;
        isAdmin?: boolean;
        adminID?: string;
        adminUsername?: string;
        adminLoginError?: string;
        mustChangePassword?: boolean;
        adminCreatedUsername?: string;
        adminCreatedPassword?: string;
        adminError?: string;
        registrationError?: string;
        registrationFormName?: string;
        registrationFormEmail?: string;
        registrationSuccess?: boolean;
        newVoterID?: string;
        loginError?: string;
        voteError?: string;
        profileError?: string;
        profileSuccess?: string;
        voteConfirmation?: {
            confirmationID: string;
            electionID: string;
            confirmedAt: string;
        };
        guestVoterID?: string;
        managementSuccess?: string;
    }

    interface FastifyReply {
        locals?: {
            voterID: string | null;
            voterName: string | null;
            isAdmin: boolean;
            adminUsername: string | null;
            siteBanner?: {
                message: string;
                type: string;
            } | null;
            signupEnabled?: boolean;
            loginEnabled?: boolean;
            testMode?: boolean;
        };
    }
}
