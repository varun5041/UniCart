import { describe, it, expect } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { app } from '../src/app.js';

describe('Phase 2 Acceptance: Dockerfile Hardening & Multi-Stage Checks', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const serverDockerfile = path.join(rootDir, 'server/Dockerfile');
  const workerDockerfile = path.join(rootDir, 'server/Dockerfile.worker');
  const clientDockerfile = path.join(rootDir, 'client/Dockerfile');
  const composeFile = path.join(rootDir, 'docker-compose.yml');
  const nginxConfigFile = path.join(rootDir, 'nginx/nginx.conf');

  it('server/Dockerfile uses multi-stage build and non-root user', () => {
    expect(fs.existsSync(serverDockerfile)).toBe(true);
    const content = fs.readFileSync(serverDockerfile, 'utf8');

    // Multi-stage builder & runner
    expect(content).toContain('AS builder');
    expect(content).toContain('AS runner');

    // Non-root USER
    expect(content).toMatch(/USER\s+(node|appuser)/);

    // Healthcheck
    expect(content).toContain('HEALTHCHECK');
  });

  it('server/Dockerfile.worker uses multi-stage build and non-root user', () => {
    expect(fs.existsSync(workerDockerfile)).toBe(true);
    const content = fs.readFileSync(workerDockerfile, 'utf8');

    expect(content).toContain('AS builder');
    expect(content).toContain('AS runner');
    expect(content).toMatch(/USER\s+(node|appuser)/);
    expect(content).toContain('dist/worker.js');
  });

  it('client/Dockerfile uses multi-stage build and unprivileged user', () => {
    expect(fs.existsSync(clientDockerfile)).toBe(true);
    const content = fs.readFileSync(clientDockerfile, 'utf8');

    expect(content).toContain('AS builder');
    expect(content).toContain('AS runner');
    expect(content).toMatch(/USER\s+nginx/);
  });

  it('docker-compose.yml includes mongo replica set, redis, api, worker, and nginx', () => {
    expect(fs.existsSync(composeFile)).toBe(true);
    const content = fs.readFileSync(composeFile, 'utf8');

    // All 5 services
    expect(content).toContain('mongo:');
    expect(content).toContain('redis:');
    expect(content).toContain('api:');
    expect(content).toContain('worker:');
    expect(content).toContain('nginx:');

    // Replica set configuration
    expect(content).toContain('--replSet');
    expect(content).toContain('rs0');
    expect(content).toContain('replicaSet=rs0');
  });

  it('nginx/nginx.conf defines load balancer upstream, rate limit, and security headers', () => {
    expect(fs.existsSync(nginxConfigFile)).toBe(true);
    const content = fs.readFileSync(nginxConfigFile, 'utf8');

    expect(content).toContain('upstream api_upstream');
    expect(content).toContain('limit_req_zone');
    expect(content).toContain('X-Frame-Options');
    expect(content).toContain('X-Content-Type-Options');
    expect(content).toContain('Content-Security-Policy');
  });
});

describe('Phase 2 Acceptance: Load Balancer Replica Distribution Support', () => {
  it('API reports container/host hostname in X-Served-By header for load balancer verification', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.headers['x-served-by']).toBe(os.hostname());
  });

  it('API returns container hostname in JSON payload for replica tracking', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.hostname).toBe(os.hostname());
  });
});
