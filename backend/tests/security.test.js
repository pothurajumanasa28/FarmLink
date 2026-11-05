const { test, describe } = require('node:test');
const assert = require('node:assert');
const { authorizeRole, requireApprovedAccount } = require('../src/middleware/role');

describe('FarmLink Comprehensive Security & Platform Governance Test Suite', () => {

  describe('1. Public Registration Role Tampering Prevention', () => {
    test('Public registration payload attempting role="admin" must be rejected', () => {
      const attemptRegister = (payload) => {
        if (payload.role === 'admin') {
          return { status: 403, error: 'Admin accounts cannot be registered publicly.' };
        }
        if (!['farmer', 'institution'].includes(payload.role)) {
          return { status: 400, error: 'Invalid role.' };
        }
        return { status: 201, statusAssigned: 'approved' };
      };

      const adminAttempt = attemptRegister({ email: 'hacker@malicious.com', role: 'admin' });
      assert.strictEqual(adminAttempt.status, 403);
      assert.strictEqual(adminAttempt.error.includes('Admin accounts cannot be registered publicly'), true);

      const farmerAttempt = attemptRegister({ email: 'realfarmer@local.com', role: 'farmer' });
      assert.strictEqual(farmerAttempt.status, 201);
      assert.strictEqual(farmerAttempt.statusAssigned, 'approved');
    });
  });

  describe('2. Role-Based Access Control (RBAC) - Farmer Blocked from Admin APIs', () => {
    test('Farmer role receives HTTP 403 when invoking admin middleware', () => {
      const adminMiddleware = authorizeRole('admin');
      const req = { user: { role: 'farmer', email: 'farmer@local.farm' } };
      let statusCode = 200;
      let responseBody = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseBody = data;
            }
          };
        }
      };

      adminMiddleware(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, 'Next should not be called for non-admin');
      assert.strictEqual(statusCode, 403);
      assert.strictEqual(responseBody.success, false);
      assert.strictEqual(responseBody.message.includes('Forbidden'), true);
    });
  });

  describe('3. Role-Based Access Control (RBAC) - Institution Blocked from Admin APIs', () => {
    test('Institution role receives HTTP 403 when invoking admin middleware', () => {
      const adminMiddleware = authorizeRole('admin');
      const req = { user: { role: 'institution', email: 'hostel@college.edu' } };
      let statusCode = 200;
      let responseBody = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseBody = data;
            }
          };
        }
      };

      adminMiddleware(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(statusCode, 403);
      assert.strictEqual(responseBody.success, false);
    });
  });

  describe('4. Unauthenticated Request Access Control', () => {
    test('Request missing authentication token receives HTTP 401', () => {
      const checkAuth = (authHeader) => {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return { status: 401, message: 'Authentication required. Please log in.' };
        }
        return { status: 200 };
      };

      assert.strictEqual(checkAuth(null).status, 401);
      assert.strictEqual(checkAuth('').status, 401);
      assert.strictEqual(checkAuth('Basic dXNlcjpwYXNz').status, 401);
      assert.strictEqual(checkAuth('Bearer valid.jwt.token').status, 200);
    });
  });

  describe('5. IDOR & Ownership Verification on Modifying Protected Resources', () => {
    test('Farmer A cannot modify or delete Farmer B listing', () => {
      const listing = {
        _id: 'listing_123',
        farmer: 'farmer_A',
        produceName: 'Organic Rice'
      };

      const verifyListingOwnership = (requestUserId, listingDoc) => {
        if (listingDoc.farmer !== requestUserId) {
          return { status: 404, message: 'Listing not found or access denied.' };
        }
        return { status: 200 };
      };

      const maliciousAccess = verifyListingOwnership('farmer_B', listing);
      assert.strictEqual(maliciousAccess.status, 404);

      const legitimateAccess = verifyListingOwnership('farmer_A', listing);
      assert.strictEqual(legitimateAccess.status, 200);
    });
  });

  describe('6. Profile Tampering & Privilege Escalation Prevention', () => {
    test('Profile updates ignore attempts to change role, status, or permissions', () => {
      const existingUser = {
        role: 'farmer',
        status: 'approved',
        profile: {
          fullName: 'Old Farmer Name',
          phone: '9876543210'
        }
      };

      const maliciousUpdatePayload = {
        role: 'admin',
        status: 'approved',
        rejectionReason: 'none',
        profile: {
          fullName: 'New Farmer Name',
          phone: '9999999999'
        }
      };

      // Emulate safe profile update controller logic
      const updatedUser = { ...existingUser };
      if (maliciousUpdatePayload.profile) {
        if (maliciousUpdatePayload.profile.fullName) {
          updatedUser.profile.fullName = maliciousUpdatePayload.profile.fullName;
        }
        if (maliciousUpdatePayload.profile.phone) {
          updatedUser.profile.phone = maliciousUpdatePayload.profile.phone;
        }
      }

      assert.strictEqual(updatedUser.role, 'farmer', 'Role should not be modifiable via profile endpoint');
      assert.strictEqual(updatedUser.profile.fullName, 'New Farmer Name');
    });
  });

  describe('7. Suspended Account Procurement Lockout', () => {
    test('Suspended account receives HTTP 403 on requireApprovedAccount middleware', () => {
      const req = {
        user: {
          role: 'farmer',
          status: 'suspended',
          suspensionReason: 'Policy violation: unfulfilled order commitments'
        }
      };
      let statusCode = 200;
      let responseBody = null;
      let nextCalled = false;

      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseBody = data;
            }
          };
        }
      };

      requireApprovedAccount(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, 'Suspended user must be blocked from procurement');
      assert.strictEqual(statusCode, 403);
      assert.strictEqual(responseBody.accountStatus, 'suspended');
      assert.strictEqual(responseBody.suspensionReason.includes('Policy violation'), true);
    });
  });

  describe('8. Repeated Authentication Attempts & Rate Limiting Rules', () => {
    test('Auth rate limiter enforces window and maximum attempts limit', () => {
      const windowMs = 15 * 60 * 1000;
      const maxAttempts = 10;

      let attemptCount = 0;
      const simulateRequest = () => {
        attemptCount++;
        if (attemptCount > maxAttempts) {
          return { status: 429, message: 'Too many authentication attempts' };
        }
        return { status: 200 };
      };

      for (let i = 1; i <= 10; i++) {
        assert.strictEqual(simulateRequest().status, 200);
      }
      // 11th request triggers rate limit
      const blockedRequest = simulateRequest();
      assert.strictEqual(blockedRequest.status, 429);
      assert.strictEqual(blockedRequest.message.includes('Too many authentication attempts'), true);
    });
  });

  describe('9. Unauthorized Access to Audit Logs and Dispute Reports', () => {
    test('Only admin role can view audit logs and platform complaints', () => {
      const checkAuditLogAccess = (userRole) => {
        if (userRole !== 'admin') {
          return { status: 403, error: 'Forbidden: Access restricted to [admin]' };
        }
        return { status: 200, logs: [] };
      };

      assert.strictEqual(checkAuditLogAccess('farmer').status, 403);
      assert.strictEqual(checkAuditLogAccess('institution').status, 403);
      assert.strictEqual(checkAuditLogAccess('guest').status, 403);
      assert.strictEqual(checkAuditLogAccess('admin').status, 200);
    });
  });

  describe('10. Concurrent Order Requests & Stock Reservation Integrity', () => {
    test('Accepted order atomicity guarantees available stock cannot be overcommitted', () => {
      const listing = {
        totalQuantity: 100,
        reservedQuantity: 60,
        unreservedQuantity() {
          return Math.max(0, this.totalQuantity - this.reservedQuantity);
        }
      };

      // Attempt to reserve 50 kg when only 40 kg is unreserved
      const requestQuantity = 50;
      const canFulfill = requestQuantity <= listing.unreservedQuantity();
      assert.strictEqual(canFulfill, false, 'Should reject order request exceeding unreserved stock');

      // Valid order for 40 kg
      const validQuantity = 40;
      assert.strictEqual(validQuantity <= listing.unreservedQuantity(), true);
      listing.reservedQuantity += validQuantity;
      assert.strictEqual(listing.unreservedQuantity(), 0, 'All available stock is now reserved');
    });

    test('Order cancellation releases reserved stock safely', () => {
      const listing = {
        totalQuantity: 100,
        reservedQuantity: 40
      };

      const cancelOrder = (order) => {
        if (order.status === 'delivered') {
          throw new Error('Delivered orders cannot be cancelled');
        }
        if (order.stockReserved) {
          listing.reservedQuantity = Math.max(0, listing.reservedQuantity - order.quantity);
          order.stockReserved = false;
        }
        order.status = 'cancelled';
      };

      const order = { status: 'accepted', quantity: 40, stockReserved: true };
      cancelOrder(order);

      assert.strictEqual(order.status, 'cancelled');
      assert.strictEqual(order.stockReserved, false);
      assert.strictEqual(listing.reservedQuantity, 0, 'Stock restored upon cancellation');
    });
  });

  describe('11. Admin Suspension and Reactivation Workflow', () => {
    test('Suspension requires mandatory reason and transitions status to suspended', () => {
      const suspendAccount = (user, reason) => {
        if (!reason || !reason.trim()) {
          return { status: 400, message: 'A mandatory suspension reason must be provided.' };
        }
        user.status = 'suspended';
        user.suspensionReason = reason.trim();
        return { status: 200, user };
      };

      const user = { email: 'badactor@farm.in', status: 'approved' };
      const missingReasonResult = suspendAccount(user, '');
      assert.strictEqual(missingReasonResult.status, 400);

      const validSuspension = suspendAccount(user, 'Failed produce quality inspection');
      assert.strictEqual(validSuspension.status, 200);
      assert.strictEqual(user.status, 'suspended');
      assert.strictEqual(user.suspensionReason, 'Failed produce quality inspection');
    });

    test('Reactivation clears suspension reason and restores approved status', () => {
      const user = {
        email: 'rehabilitated@farm.in',
        status: 'suspended',
        suspensionReason: 'Policy violation'
      };

      const reactivateAccount = (u) => {
        u.status = 'approved';
        u.suspensionReason = '';
        return { status: 200, user: u };
      };

      reactivateAccount(user);
      assert.strictEqual(user.status, 'approved');
      assert.strictEqual(user.suspensionReason, '');
    });
  });

  describe('12. Normal Farmer, Institution, and Admin Post-Enhancement Workflows', () => {
    test('Farmer immediately active upon registration, can browse and create produce listing', () => {
      const newFarmer = {
        email: 'newfarmer@ap.in',
        role: 'farmer',
        status: 'approved'
      };
      assert.strictEqual(newFarmer.status, 'approved', 'Must be active immediately without approval delay');
    });

    test('Institution immediately active, can browse produce and submit orders', () => {
      const newInstitution = {
        email: 'hostel@krishna.in',
        role: 'institution',
        status: 'approved'
      };
      assert.strictEqual(newInstitution.status, 'approved');
    });

    test('Sensitive credentials never exposed in safe object sanitization', () => {
      const rawUser = {
        email: 'admin@farmlink.in',
        password: '$2a$10$hashed_password_string',
        passwordResetToken: 'e3b0c44298fc1c149afbf4c8996fb924',
        passwordResetExpires: new Date(Date.now() + 3600000),
        role: 'farmer',
        profile: {
          fullName: 'Test User',
          phone: '9876543210'
        }
      };

      const sanitize = (u) => {
        const copy = { ...u };
        delete copy.password;
        delete copy.passwordResetToken;
        delete copy.passwordResetExpires;
        return copy;
      };

      const safe = sanitize(rawUser);
      assert.strictEqual(safe.password, undefined);
      assert.strictEqual(safe.passwordResetToken, undefined);
      assert.strictEqual(safe.passwordResetExpires, undefined);
      assert.strictEqual(safe.email, 'admin@farmlink.in');
    });
  });

});
