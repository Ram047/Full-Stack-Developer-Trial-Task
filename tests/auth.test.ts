import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hasRequiredRole, ROLE_HIERARCHY } from '../src/lib/auth';
import { LoginSchema, RegisterSchema, DealSchema } from '../src/lib/validation';

describe('Auth RBAC Role Hierarchy Checks', () => {
  it('should validate hierarchical roles correctly', () => {
    // Owner permissions
    assert.strictEqual(hasRequiredRole('OWNER', 'OWNER'), true);
    assert.strictEqual(hasRequiredRole('OWNER', 'ADMIN'), true);
    assert.strictEqual(hasRequiredRole('OWNER', 'MEMBER'), true);
    assert.strictEqual(hasRequiredRole('OWNER', 'VIEWER'), true);

    // Admin permissions
    assert.strictEqual(hasRequiredRole('ADMIN', 'OWNER'), false);
    assert.strictEqual(hasRequiredRole('ADMIN', 'ADMIN'), true);
    assert.strictEqual(hasRequiredRole('ADMIN', 'MEMBER'), true);
    assert.strictEqual(hasRequiredRole('ADMIN', 'VIEWER'), true);

    // Member permissions
    assert.strictEqual(hasRequiredRole('MEMBER', 'ADMIN'), false);
    assert.strictEqual(hasRequiredRole('MEMBER', 'MEMBER'), true);
    assert.strictEqual(hasRequiredRole('MEMBER', 'VIEWER'), true);

    // Viewer permissions
    assert.strictEqual(hasRequiredRole('VIEWER', 'MEMBER'), false);
    assert.strictEqual(hasRequiredRole('VIEWER', 'VIEWER'), true);
  });

  it('should match role hierarchy values', () => {
    assert.strictEqual(ROLE_HIERARCHY.OWNER, 4);
    assert.strictEqual(ROLE_HIERARCHY.ADMIN, 3);
    assert.strictEqual(ROLE_HIERARCHY.MEMBER, 2);
    assert.strictEqual(ROLE_HIERARCHY.VIEWER, 1);
  });
});

describe('Zod Form Validation Schemas', () => {
  it('should validate login credentials', () => {
    const valid = LoginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
    assert.strictEqual(valid.success, true);

    const invalidEmail = LoginSchema.safeParse({ email: 'notanemail', password: 'password123' });
    assert.strictEqual(invalidEmail.success, false);

    const shortPassword = LoginSchema.safeParse({ email: 'test@example.com', password: '123' });
    assert.strictEqual(shortPassword.success, false);
  });

  it('should validate deal input requirements', () => {
    const validDeal = DealSchema.safeParse({
      title: 'Enterprise License Renewal',
      value: 50000,
      stage: 'PROPOSAL',
      probability: 70,
    });
    assert.strictEqual(validDeal.success, true);

    const negativeValueDeal = DealSchema.safeParse({
      title: 'Enterprise License Renewal',
      value: -1000,
      stage: 'PROPOSAL',
      probability: 70,
    });
    assert.strictEqual(negativeValueDeal.success, false);

    const invalidStageDeal = DealSchema.safeParse({
      title: 'Enterprise License Renewal',
      value: 50000,
      stage: 'UNKNOWN_STAGE',
      probability: 70,
    });
    assert.strictEqual(invalidStageDeal.success, false);
  });
});
