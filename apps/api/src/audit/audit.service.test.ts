import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb } from '../../test/test-db.js';
import { RequestContext } from '../common/request-context.js';
import { type Db } from '../db/db.js';
import { AuditService } from './audit.service.js';

describe('AuditService', () => {
  let db: Db;
  let close: () => Promise<void>;
  let audit: AuditService;
  const org = '019a0f3c-0000-7000-8000-000000000001';
  const actor = '019a0f3c-0000-7000-8000-000000000002';
  const entity = '019a0f3c-0000-7000-8000-000000000003';

  beforeAll(async () => {
    ({ db, close } = await createTestDb());
    audit = new AuditService(db);
  });
  afterAll(() => close());

  it('records the change together with the request context', async () => {
    await RequestContext.run(
      { requestId: 'req-1', ip: '10.0.0.1', deviceId: 'dev-1', actorUserId: actor, organizationId: org },
      () =>
        db.transaction((tx) =>
          audit.record(tx, {
            action: 'workout.edited',
            entityType: 'workout_session',
            entityId: entity,
            before: { reps: 8 },
            after: { reps: 10 },
            reason: 'typo',
          }),
        ),
    );

    const [row] = await audit.find({ entityType: 'workout_session', entityId: entity });
    expect(row).toMatchObject({
      action: 'workout.edited',
      organizationId: org,
      actorUserId: actor,
      before: { reps: 8 },
      after: { reps: 10 },
      reason: 'typo',
      requestId: 'req-1',
      ip: '10.0.0.1',
      deviceId: 'dev-1',
    });
  });

  it('works outside a request (system jobs) and filters by actor', async () => {
    await audit.record(db, { action: 'data.destroyed', entityType: 'client' });

    const system = await audit.find({ entityType: 'client' });
    expect(system[0]).toMatchObject({ actorUserId: null, requestId: null });
    expect(await audit.find({ actorUserId: actor })).toHaveLength(1);
  });
});
