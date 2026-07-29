import crypto from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDbFile = `test-${process.pid}.db`;
const testDbPath = resolve(process.cwd(), testDbFile);
const testDbUrl = `file:./${testDbFile}`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'ValidPass123!';
const WRONG_TEST_PASSWORD = 'DefinitelyWrong123!';
const UPDATED_TEST_PASSWORD = 'NewValidPass123!';
const INVALID_TEST_TOKEN = 'not-a-jwt';
const TEST_JWT_SECRET = 'vitest-secret';

let prisma;
let authService;
let placesService;
let authenticate;
let sse;

function createTestDatabase() {
  const db = new Database(testDbPath);
  const migrationsDir = resolve(process.cwd(), 'prisma/migrations');
  const migrationDirs = readdirSync(migrationsDir)
    .filter((entry) => entry !== 'migration_lock.toml')
    .sort();

  for (const dir of migrationDirs) {
    const migrationSql = readFileSync(resolve(migrationsDir, dir, 'migration.sql'), 'utf8');
    db.exec(migrationSql);
  }

  db.close();
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}@example.com`;
}

async function createUser(prefix = 'user') {
  const email = uniqueEmail(prefix);

  const user = await prisma.user.create({
    data: {
      email,
      name: prefix,
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
    },
    select: {
      id: true,
      email: true,
      name: true,
      tokenVersion: true,
      createdAt: true,
    },
  });

  return { ...user, password: TEST_PASSWORD };
}

async function createPlaceForUser(userId, overrides = {}) {
  return placesService.createPlace(
    {
      title: 'Test Place',
      description: 'Created in integration test',
      category: 'Natur',
      lat: 52.52,
      lng: 13.405,
      ...overrides,
    },
    userId,
  );
}

function createJsonResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createSseResponse() {
  const writes = [];

  return {
    writes,
    write(chunk) {
      writes.push(chunk);
    },
  };
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDbUrl;
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.FRONTEND_URL = 'http://localhost:3000';
  delete process.env.RESEND_API_KEY;

  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }

  createTestDatabase();

  prisma = (await import('../lib/prisma.js')).default;
  authService = (await import('./auth/auth.service.js')).default;
  placesService = (await import('./places/places.service.js')).default;
  authenticate = (await import('../middleware/authenticate.js')).default;
  sse = (await import('../lib/sse.js')).default;
});

beforeEach(async () => {
  await prisma.publicPlaceShare.deleteMany();
  await prisma.sharedPlace.deleteMany();
  await prisma.place.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma?.$disconnect();
  if (existsSync(testDbPath)) {
    rmSync(testDbPath);
  }
});

describe('auth edge cases', () => {
  it('rejects insecure JWT secrets in production only', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;

    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'dev-secret-change-me';
      expect(() => authService.createAuthToken({ id: 1, email: 'a@example.com', tokenVersion: 0 })).toThrow(
        'JWT_SECRET is insecure for production.',
      );

      process.env.JWT_SECRET = 'x'.repeat(31);
      expect(() => authService.createAuthToken({ id: 1, email: 'a@example.com', tokenVersion: 0 })).toThrow(
        'JWT_SECRET is insecure for production.',
      );

      process.env.JWT_SECRET = 'x'.repeat(32);
      expect(() => authService.createAuthToken({ id: 1, email: 'a@example.com', tokenVersion: 0 })).not.toThrow();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('registers a valid user with normalized email and rejects duplicates', async () => {
    const registered = await authService.registerUser({
      email: '  Fresh.User@Example.COM ',
      password: TEST_PASSWORD,
      name: 'Fresh User',
    });

    expect(registered).toMatchObject({
      email: 'fresh.user@example.com',
      name: 'Fresh User',
    });

    await expect(
      authService.registerUser({
        email: 'fresh.user@example.com',
        password: TEST_PASSWORD,
        name: 'Duplicate',
      }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
      message: 'E-Mail ist bereits vergeben.',
    });
  });

  it('rejects registration with an invalid email', async () => {
    await expect(
      authService.registerUser({
        email: 'not-an-email',
        password: TEST_PASSWORD,
        name: 'Invalid',
      }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: expect.stringContaining('E-Mail und Passwort'),
    });
  });

  it('rejects login with a wrong password', async () => {
    const user = await createUser('wrong-password');

    await expect(
      authService.loginUser({
        email: user.email,
        password: WRONG_TEST_PASSWORD,
      }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'E-Mail oder Passwort ungültig.',
    });
  });

  it('rejects login with an unknown email using the generic message', async () => {
    await expect(
      authService.loginUser({
        email: uniqueEmail('unknown'),
        password: TEST_PASSWORD,
      }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
      message: 'E-Mail oder Passwort ungültig.',
    });
  });

  it('rejects protected requests without an auth cookie', async () => {
    const req = { cookies: {} };
    const res = createJsonResponse();
    const next = () => {
      throw new Error('next should not be called');
    };

    await authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Nicht authentifiziert.' });
  });

  it('accepts protected requests with a valid auth cookie and rejects malformed tokens', async () => {
    const user = await createUser('valid-cookie');
    const token = authService.createAuthToken(user);
    const req = { cookies: { authToken: token } };
    const res = createJsonResponse();
    let nextCalled = false;

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.user).toMatchObject({ userId: user.id, email: user.email });

    const invalidReq = { cookies: { authToken: INVALID_TEST_TOKEN } };
    const invalidRes = createJsonResponse();
    await authenticate(invalidReq, invalidRes, () => {
      throw new Error('next should not be called');
    });

    expect(invalidRes.statusCode).toBe(401);
    expect(await authenticate.getAuthenticatedUserFromToken(token)).toMatchObject({
      userId: user.id,
      tokenVersion: 0,
    });
  });

  it('invalidates old tokens when tokenVersion changes', async () => {
    const user = await createUser('token-version');
    const { token } = await authService.loginUser({ email: user.email, password: TEST_PASSWORD });

    const beforeUpdate = await authenticate.getAuthenticatedUserFromToken(token);
    expect(beforeUpdate).toMatchObject({ userId: user.id, tokenVersion: 0 });

    await authService.updateUserProfile(user.id, {
      currentPassword: TEST_PASSWORD,
      newPassword: UPDATED_TEST_PASSWORD,
    });

    await expect(authenticate.getAuthenticatedUserFromToken(token)).resolves.toBeNull();
  });

  it('validates profile updates and increments tokenVersion on sensitive changes', async () => {
    const user = await createUser('profile');
    const taken = await createUser('profile-taken');

    await expect(authService.getUserProfile(user.id)).resolves.toMatchObject({
      id: user.id,
      email: user.email,
    });

    await expect(authService.updateUserProfile(user.id, {})).resolves.toMatchObject({
      id: user.id,
      tokenVersion: 0,
    });

    await expect(
      authService.updateUserProfile(user.id, { name: '  Renamed Profile  ' }),
    ).resolves.toMatchObject({
      id: user.id,
      name: 'Renamed Profile',
      tokenVersion: 0,
    });

    await expect(
      authService.updateUserProfile(user.id, { name: '   ' }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });

    await expect(
      authService.updateUserProfile(user.id, { email: 'invalid-email' }),
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });

    await expect(
      authService.updateUserProfile(user.id, { email: uniqueEmail('new-email') }),
    ).rejects.toMatchObject({
      message: 'Bitte gib dein aktuelles Passwort ein.',
    });

    await expect(
      authService.updateUserProfile(user.id, {
        email: taken.email,
        currentPassword: TEST_PASSWORD,
      }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
    });

    const updated = await authService.updateUserProfile(user.id, {
      email: uniqueEmail('updated-profile'),
      currentPassword: TEST_PASSWORD,
    });

    expect(updated.tokenVersion).toBe(1);
    expect(authService.serializeUser(updated)).toMatchObject({
      id: user.id,
      email: updated.email,
    });
  });

  it('returns null for invalid notification recipients and invalid email lookups', async () => {
    const user = await createUser('lookup');

    await expect(authService.getUserNotificationRecipient(user.id)).resolves.toMatchObject({
      email: user.email,
    });
    await expect(authService.findUserByEmail('not-an-email')).resolves.toBeNull();
  });
});

describe('places auth and sharing edge cases', () => {
  it('filters SSE place-created events to the owner and authorized recipients', async () => {
    const owner = await createUser('sse-owner');
    const other = await createUser('sse-other');
    const ownerResponse = createSseResponse();
    const otherResponse = createSseResponse();
    const place = await createPlaceForUser(owner.id, { title: 'Private SSE Place' });

    sse.registerClient(ownerResponse, { userId: owner.id });
    sse.registerClient(otherResponse, { userId: other.id });

    try {
      await sse.broadcastPlaceCreated(place);
    } finally {
      sse.removeClient(ownerResponse);
      sse.removeClient(otherResponse);
    }

    expect(ownerResponse.writes).toHaveLength(1);
    expect(ownerResponse.writes[0]).toContain('event: place-created');
    expect(ownerResponse.writes[0]).toContain(place.title);
    expect(otherResponse.writes).toHaveLength(0);
  });

  it('creates places for an authenticated user and deletes only owned places', async () => {
    const owner = await createUser('owner');
    const other = await createUser('other');
    const place = await createPlaceForUser(owner.id);

    await expect(placesService.getPlacesForUser(owner.id)).resolves.toHaveLength(1);

    await expect(placesService.deletePlace(place.id, other.id)).resolves.toBe(0);
    await expect(placesService.getPlacesForUser(owner.id)).resolves.toHaveLength(1);

    await expect(placesService.deletePlace(place.id, owner.id)).resolves.toBe(1);
    await expect(placesService.getPlacesForUser(owner.id)).resolves.toHaveLength(0);
  });

  it('updates only owned places and preserves decorated owner metadata', async () => {
    const owner = await createUser('update-owner');
    const other = await createUser('update-other');
    const place = await createPlaceForUser(owner.id, {
      tripName: ' Berlin ',
      status: 'planned',
      moodTags: ['kultur', 'essen', 'kultur'],
    });

    expect(place).toMatchObject({
      title: 'Test Place',
      owner: { id: owner.id, email: owner.email },
      moodTags: JSON.stringify(['kultur', 'essen']),
      canEdit: true,
      sharedWithMe: false,
    });

    await expect(
      placesService.updatePlace(place.id, {
        title: 'Other Update',
        lat: 1,
        lng: 1,
      }, other.id),
    ).resolves.toBeNull();

    await expect(
      placesService.updatePlace(place.id, {
        title: 'Updated Place',
        description: '',
        category: 'Natur',
        tripName: '',
        status: '',
        moodTags: '',
        lat: 48.137,
        lng: 11.575,
      }, owner.id),
    ).resolves.toMatchObject({
      title: 'Updated Place',
      description: null,
      tripName: null,
      status: null,
      moodTags: null,
    });
  });

  it('rejects invalid place data before persistence', async () => {
    const owner = await createUser('invalid-place');

    await expect(
      placesService.createPlace({ title: '', lat: '52.52', lng: 13.405 }, owner.id),
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('trims valid place text and rejects invalid core place fields', async () => {
    const owner = await createUser('place-validation');

    await expect(
      placesService.createPlace({
        title: '  Trimmed Place  ',
        description: '  Optional description  ',
        category: '  Restaurant  ',
        lat: 90,
        lng: -180,
      }, owner.id),
    ).resolves.toMatchObject({
      title: 'Trimmed Place',
      description: 'Optional description',
      category: 'Restaurant',
      lat: 90,
      lng: -180,
    });

    const invalidPlaces = [
      { title: 'x'.repeat(121), lat: 52.52, lng: 13.405 },
      { title: 'Valid title', description: 'x'.repeat(1001), lat: 52.52, lng: 13.405 },
      { title: 'Valid title', category: 'Museum', lat: 52.52, lng: 13.405 },
      { title: 'Valid title', lat: Number.NaN, lng: 13.405 },
      { title: 'Valid title', lat: 91, lng: 13.405 },
      { title: 'Valid title', lat: 52.52, lng: -181 },
    ];

    for (const invalidPlace of invalidPlaces) {
      await expect(
        placesService.createPlace(invalidPlace, owner.id),
      ).rejects.toMatchObject({ name: 'ValidationError' });
    }
  });

  it('rejects invalid optional place metadata', async () => {
    const owner = await createUser('invalid-metadata');

    await expect(
      createPlaceForUser(owner.id, { tripName: 'x'.repeat(81) }),
    ).rejects.toMatchObject({ name: 'ValidationError' });

    await expect(
      createPlaceForUser(owner.id, { status: 'unknown' }),
    ).rejects.toMatchObject({ name: 'ValidationError' });

    await expect(
      createPlaceForUser(owner.id, { moodTags: '{"not":"an array"}' }),
    ).rejects.toMatchObject({ name: 'ValidationError' });

    await expect(
      createPlaceForUser(owner.id, { moodTags: ['unknown'] }),
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('does not enumerate users when sharing with an unknown email', async () => {
    const owner = await createUser('share-owner');
    const place = await createPlaceForUser(owner.id);

    await expect(
      placesService.sharePlace(place.id, owner.id, uniqueEmail('missing-recipient')),
    ).resolves.toEqual({
      success: true,
      message: 'Teilanfrage verarbeitet.',
    });

    await expect(prisma.sharedPlace.count()).resolves.toBe(0);
  });

  it('shares with a known recipient without exposing a different response shape', async () => {
    const owner = await createUser('share-owner');
    const recipient = await createUser('share-recipient');
    const place = await createPlaceForUser(owner.id);

    await expect(
      placesService.sharePlace(place.id, owner.id, recipient.email),
    ).resolves.toEqual({
      success: true,
      message: 'Teilanfrage verarbeitet.',
    });

    await expect(prisma.sharedPlace.count()).resolves.toBe(1);
    const recipientPlaces = await placesService.getPlacesForUser(recipient.id);
    expect(recipientPlaces[0]).toMatchObject({
      id: place.id,
      sharedWithMe: true,
      canEdit: false,
    });
  });

  it('rejects sharing with yourself and returns null for missing owner resources', async () => {
    const owner = await createUser('share-self');
    const other = await createUser('share-missing');
    const place = await createPlaceForUser(owner.id);

    await expect(placesService.sharePlace(999999, owner.id, other.email)).resolves.toBeNull();
    await expect(placesService.sharePlace(place.id, owner.id, owner.email)).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('removes shares only for the owning user', async () => {
    const owner = await createUser('unshare-owner');
    const recipient = await createUser('unshare-recipient');
    const other = await createUser('unshare-other');
    const place = await createPlaceForUser(owner.id);

    await placesService.sharePlace(place.id, owner.id, recipient.email);
    const share = await prisma.sharedPlace.findFirst({ where: { placeId: place.id } });

    await expect(placesService.unsharePlace(place.id, other.id, share.id)).resolves.toBeNull();
    await expect(placesService.unsharePlace(place.id, owner.id, share.id)).resolves.toMatchObject({
      id: place.id,
      shares: [],
    });
  });

  it('creates, reads, refreshes, and disables public share links', async () => {
    const owner = await createUser('public-owner');
    const other = await createUser('public-other');
    const place = await createPlaceForUser(owner.id);

    await expect(placesService.createPublicShareLink(place.id, other.id)).resolves.toBeNull();

    const withPublicShare = await placesService.createPublicShareLink(place.id, owner.id);
    expect(withPublicShare.publicShare).toMatchObject({ enabled: true });
    expect(withPublicShare.publicShare.url).toContain('/share/');

    await expect(
      placesService.getPublicSharedPlace(withPublicShare.publicShare.token),
    ).resolves.toMatchObject({
      title: place.title,
      canEdit: false,
      owner: { name: owner.name },
    });

    await expect(placesService.getPublicSharedPlace('invalid-token')).rejects.toMatchObject({
      name: 'ValidationError',
    });

    await expect(placesService.disablePublicShareLink(place.id, other.id)).resolves.toBeNull();
    const disabledPlace = await placesService.disablePublicShareLink(place.id, owner.id);
    expect(disabledPlace.publicShare).toBeNull();
    await expect(placesService.getPublicSharedPlace(withPublicShare.publicShare.token)).resolves.toBeNull();
  });
});
