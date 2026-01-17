import type { User, Campsite, Profile, UserRole, CampsiteType } from '../src/types';

describe('Type Exports', () => {
  it('exports User type correctly', () => {
    const user: User = {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      phone: null,
      avatar_url: null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(user.role).toBe('user');
  });

  it('exports Campsite type correctly', () => {
    const campsite: Campsite = {
      id: '123',
      owner_id: '456',
      name: 'Test Camp',
      description: 'Test description',
      province_id: 1,
      address: 'Test address',
      latitude: 13.7563,
      longitude: 100.5018,
      campsite_type: 'camping',
      status: 'approved',
      is_featured: false,
      average_rating: 4.5,
      review_count: 10,
      min_price: 500,
      max_price: 1500,
      check_in_time: '14:00',
      check_out_time: '12:00',
      phone: null,
      email: null,
      website: null,
      booking_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(campsite.campsite_type).toBe('camping');
  });
});
