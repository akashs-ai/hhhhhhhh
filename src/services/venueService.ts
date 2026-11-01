import { Booking, VenueItem, WaitlistItem } from '../types';

export interface VenueStats {
  total_venues: number;
  available_venues: number;
  occupied_venues: number;
  maintenance_venues: number;
  active_venues: number;
  occupancy_rate: number;
  pending_approvals: number;
}

export interface VenuesResponse {
  success: boolean;
  count: number;
  stats: VenueStats;
  data: VenueItem[];
}

export interface AvailabilitySlot {
  period: number;
  time: string;
  status: 'available' | 'occupied' | 'maintenance';
  label: string;
  details?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  data: {
    room_id: string;
    room_name: string;
    capacity: number;
    day: string;
    date?: string;
    slots: AvailabilitySlot[];
  };
}

export const venueService = {
  async getVenues(
    token?: string,
    params?: {
      day?: string;
      date?: string;
      period?: number;
      start_period?: number;
      end_period?: number;
      classification?: string;
      type?: string;
      min_capacity?: number;
      max_capacity?: number;
      status?: string;
    }
  ): Promise<VenuesResponse> {
    const query = new URLSearchParams();
    if (params) {
      if (params.day) query.set('day', params.day);
      if (params.date) query.set('date', params.date);
      if (params.period) query.set('period', String(params.period));
      if (params.start_period) query.set('start_period', String(params.start_period));
      if (params.end_period) query.set('end_period', String(params.end_period));
      if (params.classification) query.set('classification', params.classification);
      if (params.type) query.set('type', params.type);
      if (params.min_capacity) query.set('min_capacity', String(params.min_capacity));
      if (params.max_capacity) query.set('max_capacity', String(params.max_capacity));
      if (params.status) query.set('status', params.status);
    }

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/venues?${query.toString()}`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch venues');
    }
    return json;
  },

  async registerVenue(
    token: string,
    venueData: {
      id: string;
      name: string;
      type: string;
      building: string;
      capacity: number;
      features?: string[];
      accessible?: boolean;
      allowed_uses?: string[];
    }
  ): Promise<VenueItem> {
    const res = await fetch('/api/venues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(venueData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to register venue');
    }
    return json.data;
  },

  async blockVenueMaintenance(
    token: string,
    maintenanceData: {
      room_id: string;
      day: string;
      start_period: number;
      end_period: number;
      reason: string;
      date?: string;
      start_time?: string;
      end_time?: string;
    }
  ): Promise<any> {
    const res = await fetch('/api/venues/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(maintenanceData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to block venue for maintenance');
    }
    return json;
  },

  async unblockVenueMaintenance(token: string, blockId: string): Promise<void> {
    const res = await fetch(`/api/venues/maintenance/${encodeURIComponent(blockId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to remove maintenance block');
    }
  },

  async getVenueAvailability(
    token?: string,
    roomId?: string,
    day?: string,
    date?: string
  ): Promise<AvailabilityResponse> {
    const query = new URLSearchParams();
    if (roomId) query.set('room_id', roomId);
    if (day) query.set('day', day);
    if (date) query.set('date', date);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/venues/availability?${query.toString()}`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to query availability matrix');
    }
    return json;
  },

  async exportOccupancyReport(token: string, day?: string): Promise<void> {
    const query = new URLSearchParams({ format: 'csv' });
    if (day) query.set('day', day);

    const res = await fetch(`/api/venues/occupancy-report?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/csv',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      try {
        const parsed = JSON.parse(errText);
        throw new Error(parsed.error?.message || 'Export failed');
      } catch {
        throw new Error(`Export failed: HTTP ${res.status}`);
      }
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cit_venue_occupancy_report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async getBookings(
    token?: string,
    params?: {
      status?: string;
      mine?: boolean;
      role?: string;
      room?: string;
      search?: string;
    }
  ): Promise<{ success: boolean; count: number; stats: any; data: Booking[] }> {
    const query = new URLSearchParams();
    if (params) {
      if (params.status) query.set('status', params.status);
      if (params.mine) query.set('mine', 'true');
      if (params.role) query.set('role', params.role);
      if (params.room) query.set('room', params.room);
      if (params.search) query.set('search', params.search);
    }

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/bookings?${query.toString()}`, { headers });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch bookings');
    }
    return json;
  },

  async createBooking(
    token: string,
    bookingData: {
      title: string;
      attendance: number;
      duration_periods: number;
      windows: Array<{ day: string; from_period: number; to_period: number }>;
      room_types?: string[];
      requested_room?: string | null;
      needs?: string[];
      requested_category?: string;
    }
  ): Promise<Booking> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to submit booking request');
    }
    return json.data;
  },

  async decideBooking(
    token: string,
    bookingId: string,
    decision: {
      status: 'approved' | 'rejected' | 'alternative_offered';
      reason?: string;
      room_id?: string;
      day?: string;
      start_period?: number;
      end_period?: number;
    }
  ): Promise<Booking> {
    const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('cit_auth_token') : '') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }

    const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/decision`, {
      method: 'POST',
      headers,
      body: JSON.stringify(decision),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to record decision');
    }
    return json.data;
  },

  async cancelBooking(token: string, bookingId: string): Promise<void> {
    const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to withdraw booking');
    }
  },

  async joinWaitlist(
    token: string,
    data: {
      venue_id: string;
      day: string;
      period: number;
      date?: string;
      purpose?: string;
    }
  ): Promise<WaitlistItem> {
    const res = await fetch('/api/venues/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to join waitlist');
    }
    return json.data;
  },

  async getWaitlist(token: string): Promise<WaitlistItem[]> {
    const res = await fetch('/api/venues/waitlist', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to fetch waitlist');
    }
    return json.data || [];
  },
};
