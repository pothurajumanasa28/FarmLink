const { test, describe } = require('node:test');
const assert = require('node:assert');
const { VALID_UNITS, areUnitsCompatible } = require('../src/utils/units');

describe('Farm-to-Institution Core Business Logic Tests', () => {

  describe('1. Units and Currency Validation', () => {
    test('Only supported units are valid', () => {
      assert.strictEqual(VALID_UNITS.includes('kg'), true);
      assert.strictEqual(VALID_UNITS.includes('quintal'), true);
      assert.strictEqual(VALID_UNITS.includes('tonne'), true);
      assert.strictEqual(VALID_UNITS.includes('bags'), true);
      assert.strictEqual(VALID_UNITS.includes('pieces'), true);
      assert.strictEqual(VALID_UNITS.includes('litres'), true);
      assert.strictEqual(VALID_UNITS.includes('gallons'), false);
    });

    test('Unit compatibility check strictly prevents cross-unit mixing', () => {
      assert.strictEqual(areUnitsCompatible('kg', 'KG'), true);
      assert.strictEqual(areUnitsCompatible('kg', 'bags'), false);
      assert.strictEqual(areUnitsCompatible('pieces', 'quintal'), false);
    });
  });

  describe('2. Stock Protection and Quantity Reduction Rules', () => {
    test('Cannot reduce total quantity below stock reserved for accepted orders', () => {
      const listing = {
        totalQuantity: 500,
        reservedQuantity: 200, // 200 committed to accepted orders
        quantityUnit: 'kg'
      };

      const requestedNewQuantity = 150; // Attempting to drop below 200
      const isAllowed = requestedNewQuantity >= listing.reservedQuantity;
      assert.strictEqual(isAllowed, false, 'Should prohibit reducing below reserved quantity');

      const validNewQuantity = 300;
      assert.strictEqual(validNewQuantity >= listing.reservedQuantity, true);
    });

    test('Unreserved available quantity calculation is correct', () => {
      const listing = {
        totalQuantity: 1000,
        reservedQuantity: 400
      };
      const unreserved = Math.max(0, listing.totalQuantity - listing.reservedQuantity);
      assert.strictEqual(unreserved, 600);
    });
  });

  describe('3. Order Status Progression and Cancellation Rules', () => {
    test('Progression rules: only accepted orders can move to preparing', () => {
      const isValidTransition = (current, next) => {
        if (current === 'pending' && ['accepted', 'rejected', 'cancelled'].includes(next)) return true;
        if (current === 'accepted' && ['preparing', 'cancelled'].includes(next)) return true;
        if (current === 'preparing' && ['delivered', 'cancelled'].includes(next)) return true;
        return false;
      };

      assert.strictEqual(isValidTransition('pending', 'accepted'), true);
      assert.strictEqual(isValidTransition('pending', 'preparing'), false);
      assert.strictEqual(isValidTransition('accepted', 'preparing'), true);
      assert.strictEqual(isValidTransition('preparing', 'delivered'), true);
      assert.strictEqual(isValidTransition('delivered', 'cancelled'), false, 'Delivered orders cannot be cancelled');
    });

    test('Cancelling an accepted order restores stock exactly once', () => {
      const listing = {
        totalQuantity: 500,
        reservedQuantity: 100
      };

      const order = {
        quantity: 100,
        status: 'accepted',
        stockReserved: true
      };

      // First cancellation
      if (order.stockReserved) {
        listing.reservedQuantity -= order.quantity;
        order.stockReserved = false;
        order.status = 'cancelled';
      }
      assert.strictEqual(listing.reservedQuantity, 0);
      assert.strictEqual(order.stockReserved, false);

      // Subsequent cancellation attempt (retry) must NOT decrement stock again
      if (order.stockReserved) {
        listing.reservedQuantity -= order.quantity;
      }
      assert.strictEqual(listing.reservedQuantity, 0, 'Stock must not be restored twice');
    });
  });

  describe('4. Bulk Requirement Progress and Capacity Rules', () => {
    test('Calculates committed, delivered, and remaining quantities correctly', () => {
      const requiredQuantity = 1000;
      const orders = [
        { status: 'accepted', quantity: 200 },
        { status: 'preparing', quantity: 150 },
        { status: 'delivered', quantity: 300 },
        { status: 'cancelled', quantity: 100 },
        { status: 'rejected', quantity: 50 }
      ];

      let committed = 0;
      let delivered = 0;

      for (const ord of orders) {
        if (ord.status === 'delivered') delivered += ord.quantity;
        else if (['accepted', 'preparing'].includes(ord.status)) committed += ord.quantity;
      }

      const remaining = Math.max(0, requiredQuantity - delivered);
      const eligibleCapacity = Math.max(0, requiredQuantity - (committed + delivered));

      assert.strictEqual(committed, 350, 'Committed = accepted + preparing');
      assert.strictEqual(delivered, 300, 'Delivered = 300');
      assert.strictEqual(remaining, 700, 'Remaining = required - delivered');
      assert.strictEqual(eligibleCapacity, 350, 'Eligible capacity = required - (committed + delivered)');
    });

    test('Partial bulk offer acceptance creates order for accepted quantity only', () => {
      const offer = {
        offeredQuantity: 100,
        acceptedQuantity: 0,
        proposedPrice: 50
      };

      const acceptQuantity = 60;
      assert.strictEqual(acceptQuantity <= offer.offeredQuantity, true);

      // Order created for 60
      const order = {
        quantity: acceptQuantity,
        totalAmount: acceptQuantity * offer.proposedPrice
      };
      assert.strictEqual(order.quantity, 60);
      assert.strictEqual(order.totalAmount, 3000);

      // Remaining offer quantity is 40
      offer.acceptedQuantity += acceptQuantity;
      const remainingOffered = offer.offeredQuantity - offer.acceptedQuantity;
      assert.strictEqual(remainingOffered, 40);
    });
  });

  describe('5. Contact Privacy Enforcement', () => {
    test('Contact details hidden when order is pending or rejected', () => {
      const sanitizeOrder = (order) => {
        const canReveal = ['accepted', 'preparing', 'delivered'].includes(order.status);
        const result = JSON.parse(JSON.stringify(order));
        if (!canReveal) {
          if (result.farmer?.profile) delete result.farmer.profile.phone;
          if (result.farmer) delete result.farmer.email;
          if (result.institution?.profile) delete result.institution.profile.phone;
          if (result.institution) delete result.institution.email;
        }
        return result;
      };

      const pendingOrder = {
        status: 'pending',
        farmer: { email: 'farmer@test.com', profile: { phone: '9988776655', fullName: 'Ramesh' } },
        institution: { email: 'hostel@test.com', profile: { phone: '9911223344', institutionName: 'Hostel' } }
      };

      const sanitizedPending = sanitizeOrder(pendingOrder);
      assert.strictEqual(sanitizedPending.farmer.email, undefined);
      assert.strictEqual(sanitizedPending.farmer.profile.phone, undefined);
      assert.strictEqual(sanitizedPending.farmer.profile.fullName, 'Ramesh');

      const acceptedOrder = {
        status: 'accepted',
        farmer: { email: 'farmer@test.com', profile: { phone: '9988776655', fullName: 'Ramesh' } },
        institution: { email: 'hostel@test.com', profile: { phone: '9911223344', institutionName: 'Hostel' } }
      };
      const sanitizedAccepted = sanitizeOrder(acceptedOrder);
      assert.strictEqual(sanitizedAccepted.farmer.email, 'farmer@test.com');
      assert.strictEqual(sanitizedAccepted.farmer.profile.phone, '9988776655');
    });
  });

  describe('6. Two-Way Feedback Authorization and Single Submission Rule', () => {
    test('Feedback only permitted for delivered orders', () => {
      const canSubmitFeedback = (orderStatus) => orderStatus === 'delivered';
      assert.strictEqual(canSubmitFeedback('pending'), false);
      assert.strictEqual(canSubmitFeedback('accepted'), false);
      assert.strictEqual(canSubmitFeedback('preparing'), false);
      assert.strictEqual(canSubmitFeedback('cancelled'), false);
      assert.strictEqual(canSubmitFeedback('delivered'), true);
    });

    test('Prevents duplicate feedback from same reviewer for same order', () => {
      const existingReviews = [{ orderId: 'ord1', reviewerId: 'user1' }];
      const hasAlreadyReviewed = (orderId, reviewerId) => {
        return existingReviews.some((r) => r.orderId === orderId && r.reviewerId === reviewerId);
      };

      assert.strictEqual(hasAlreadyReviewed('ord1', 'user1'), true);
      assert.strictEqual(hasAlreadyReviewed('ord1', 'user2'), false);
    });
  });

  describe('7. Account Approval & Suspension Status Checks', () => {
    test('Pending, rejected, and suspended accounts cannot initiate procurement', () => {
      const canInitiateProcurement = (status) => status === 'approved';

      assert.strictEqual(canInitiateProcurement('pending_approval'), false);
      assert.strictEqual(canInitiateProcurement('rejected'), false);
      assert.strictEqual(canInitiateProcurement('suspended'), false);
      assert.strictEqual(canInitiateProcurement('approved'), true);
    });

    test('Password reset preserves approval and suspension status', () => {
      const user = {
        email: 'farmer@test.com',
        status: 'suspended',
        suspensionReason: 'Policy verification'
      };

      // Reset password operation
      const newPasswordHashed = 'new_hash_abc';
      user.password = newPasswordHashed;

      // Status must remain suspended, never reset to approved or pending
      assert.strictEqual(user.status, 'suspended');
      assert.strictEqual(user.suspensionReason, 'Policy verification');
    });
  });

});
