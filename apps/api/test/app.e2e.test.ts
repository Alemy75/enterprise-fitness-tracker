import { Controller, Get, type INestApplication, NotFoundException, Query } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ZodValidationPipe } from '../src/common/zod-validation.pipe.js';
import { DB } from '../src/db/db.js';
import { createTestDb, TEST_ENV } from './test-db.js';

@Controller('probe')
class ProbeController {
  @Get('validate')
  validate(
    @Query(new ZodValidationPipe(z.object({ n: z.coerce.number().int().positive() }))) q: { n: number },
  ) {
    return q;
  }

  @Get('missing')
  missing(): never {
    throw new NotFoundException('Client not found');
  }

  @Get('crash')
  crash(): never {
    throw new Error('secret internal detail');
  }
}

describe('API (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    Object.assign(process.env, TEST_ENV);
    const testDb = await createTestDb();
    closeDb = testDb.close;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    })
      .overrideProvider(DB)
      .useValue(testDb.db)
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    baseUrl = (await app.getUrl()).replace('[::1]', '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it('GET /health/ready reports the database', async () => {
    const res = await fetch(`${baseUrl}/health/ready`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok', checks: { database: { status: 'ok' } } });
  });

  it('echoes or generates a request id', async () => {
    const own = await fetch(`${baseUrl}/health/live`, { headers: { 'x-request-id': 'abc-123' } });
    expect(own.headers.get('x-request-id')).toBe('abc-123');
    const generated = await fetch(`${baseUrl}/health/live`);
    expect(generated.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns RFC 7807 validation errors', async () => {
    const res = await fetch(`${baseUrl}/probe/validate?n=-1`);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(await res.json()).toMatchObject({
      title: 'Validation failed',
      status: 400,
      errors: [{ path: 'n' }],
    });
  });

  it('keeps the message of HTTP exceptions', async () => {
    const res = await fetch(`${baseUrl}/probe/missing`);
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({
      status: 404,
      detail: 'Client not found',
      instance: '/probe/missing',
    });
  });

  it('hides internal error details', async () => {
    const res = await fetch(`${baseUrl}/probe/crash`);
    expect(res.status).toBe(500);
    const body = await res.text();
    expect(body).not.toContain('secret');
    expect(JSON.parse(body)).toMatchObject({ title: 'Internal server error', status: 500 });
  });
});
