import { randomUUID } from 'crypto';
import { DatabaseConnection } from './db/connection';
import { ElectionType, ElectionStatus, RegistrationStatus } from './domain/enums';
import { VoterRepository } from './repositories/VoterRepository';
import { ElectionRepository } from './repositories/ElectionRepository';
import { CandidateRepository } from './repositories/CandidateRepository';
import { AdminRepository } from './repositories/AdminRepository';
import { Voter } from './domain/entities/Voter';
import { Election } from './domain/entities/Election';
import { Candidate } from './domain/entities/Candidate';
import { Admin } from './domain/entities/Admin';
import { PasswordUtil } from './utils/password';
import { rm } from 'fs/promises';

interface VoterData {
    name: string;
    email: string;
    password: string;
    status?: RegistrationStatus;
}

interface CandidateData {
    name: string;
    party: string;
    bio: string;
}

interface ElectionData {
    name: string;
    type: ElectionType;
    startDate: Date;
    endDate: Date;
    description: string;
    status: ElectionStatus;
    candidates: CandidateData[];
}

async function seedDatabase(): Promise<void> {
    const argv = process.argv.slice(2);

    console.log('Seeding database...');

    // Initialize database
    const db = DatabaseConnection.getInstance();

    const voterRepo = new VoterRepository(db);
    const electionRepo = new ElectionRepository(db);
    const candidateRepo = new CandidateRepository(db);
    const adminRepo = new AdminRepository(db);

    if (argv.includes('--reset')) {
        console.log('Resetting database...');
        await rm(DatabaseConnection.DB_PATH, { force: true });
        console.log('✓ Database reset complete');
        return;
    }

    DatabaseConnection.runMigrations();

    // Helper to create and save a voter
    const createVoter = async (data: VoterData): Promise<Voter> => {
        const voter = new Voter(
            randomUUID(),
            data.name,
            data.email,
            await PasswordUtil.hash(data.password),
            data.status || RegistrationStatus.APPROVED,
            new Date()
        );
        voterRepo.save(voter);
        console.log(`  ✓ Voter: ${voter.name} (${voter.email}) - Status: ${voter.registrationStatus}, Password: ${data.password}`);
        return voter;
    };

    // Helper to create and save an admin
    const createAdmin = async (username: string, password: string, fullName: string): Promise<Admin> => {
        const admin = new Admin(
            randomUUID(),
            username,
            await PasswordUtil.hash(password),
            fullName,
            new Date()
        );
        adminRepo.save(admin);
        console.log(`  ✓ Admin: ${admin.name} (@${admin.username}) - Password: ${password}`);
        return admin;
    };

    // Helper to create election with candidates
    const createElection = (data: ElectionData): Election => {
        const election = new Election(
            randomUUID(),
            data.name,
            data.type,
            data.startDate,
            data.endDate,
            data.description,
            data.status
        );
        electionRepo.save(election);
        
        const startStr = data.startDate.toLocaleDateString();
        const endStr = data.endDate.toLocaleDateString();
        console.log(`  ✓ Election: "${election.name}" (${election.electionType}) - ${startStr} to ${endStr} - Status: ${election.status}`);

        data.candidates.forEach(candidateData => {
            const candidate = new Candidate(
                randomUUID(),
                election.electionID,
                candidateData.name,
                candidateData.party,
                candidateData.bio
            );
            candidateRepo.save(candidate);
            console.log(`    • Candidate: ${candidate.name} (${candidate.party}) - Bio: ${candidate.biography}`);
        });

        return election;
    };

    // Helper to calculate date offsets
    const daysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Track what we create
    const createdAdmins: Admin[] = [];
    const createdVoters: Voter[] = [];
    const createdElections: Election[] = [];

    // Seed elections
    const elections: ElectionData[] = [
        {
            name: 'Local Council Election 2024',
            type: ElectionType.FPTP,
            startDate: new Date(),
            endDate: daysFromNow(7),
            description: 'Election for local council representatives using First Past The Post system',
            status: ElectionStatus.ACTIVE,
            candidates: [
                { name: 'Sarah Williams', party: 'Progressive Party', bio: 'Community advocate with 10 years experience' },
                { name: 'John Davis', party: 'Conservative Alliance', bio: 'Former business owner focused on economic growth' },
                { name: 'Maria Garcia', party: 'Green Party', bio: 'Environmental activist and sustainability expert' }
            ]
        },
        {
            name: 'University Student Union President',
            type: ElectionType.STV,
            startDate: daysFromNow(-4),
            endDate: daysFromNow(9),
            description: 'Student union presidential election using Single Transferable Vote',
            status: ElectionStatus.ACTIVE,
            candidates: [
                { name: 'Emma Thompson', party: 'Students First', bio: 'Second-year Law student, former class representative' },
                { name: 'James Wilson', party: 'Independent', bio: 'Third-year Engineering student, club president' },
                { name: 'Lisa Chen', party: 'Progressive Students', bio: 'Final-year Business student, activist' },
                { name: 'Michael Brown', party: 'Independent', bio: 'Second-year Politics student, debating champion' }
            ]
        },
        {
            name: 'Sports Club Captain Election',
            type: ElectionType.AV,
            startDate: daysFromNow(-14),
            endDate: daysFromNow(7),
            description: 'Annual election for sports club captain using Alternative Vote',
            status: ElectionStatus.ACTIVE,
            candidates: [
                { name: 'Tom Harris', party: 'Independent', bio: 'Three-time team MVP' },
                { name: 'Sophie Anderson', party: 'Independent', bio: 'Former assistant captain' },
                { name: 'David Martinez', party: 'Independent', bio: 'Longest-serving member' }
            ]
        }
    ];

    console.log('\nCreating elections:');
    elections.forEach(electionData => {
        createdElections.push(createElection(electionData));
    });

    // Seed voters
    const voters: VoterData[] = [
        { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123' },
        { name: 'Bob Smith', email: 'bob@example.com', password: 'password123' }
    ];

    console.log('\nCreating voters:');
    for (const voterData of voters) {
        createdVoters.push(await createVoter(voterData));
    }

    // Seed admins
    const adminsData = [
        { username: 'admin', password: 'admin123', fullName: 'System Administrator' }
    ];

    console.log('\nCreating admins:');
    for (const data of adminsData) {
        createdAdmins.push(await createAdmin(data.username, data.password, data.fullName));
    }

    // Dynamic summary
    const totalCandidates = elections.reduce((sum, e) => sum + e.candidates.length, 0);
    const electionsByStatus = createdElections.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + 1;
        return acc;
    }, {} as Record<ElectionStatus, number>);
    const electionsByType = createdElections.reduce((acc, e) => {
        acc[e.electionType] = (acc[e.electionType] || 0) + 1;
        return acc;
    }, {} as Record<ElectionType, number>);

    console.log('\nDatabase seeded successfully!');
    console.log(`\nSummary:`);
    console.log(`  Elections:  ${createdElections.length} (${Object.entries(electionsByType).map(([t, c]) => `${c} ${t}`).join(', ')})`);
    console.log(`  Candidates: ${totalCandidates}`);
    console.log(`  Voters:     ${createdVoters.length}`);
    console.log(`  Admins:     ${createdAdmins.length}`);
    console.log(`  Status:     ${Object.entries(electionsByStatus).map(([s, c]) => `${c} ${s}`).join(', ')}`);
}

seedDatabase().catch(console.error);
