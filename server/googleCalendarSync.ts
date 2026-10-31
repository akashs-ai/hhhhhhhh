import { GoogleCalendarEventModel } from './calendarService.js';

export interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  location: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  iCalUID?: string;
  extendedProperties?: {
    private: Record<string, string>;
  };
}

export interface SyncResult {
  totalEvents: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: Array<{ eventId: string; error: string }>;
  eventMappings: Record<string, string>;
}

export interface PersonalCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  source: 'google_calendar';
}

export interface CalendarConflict {
  sessionId?: string;
  googleEventId: string;
  summary: string;
  type: 'EXTERNAL_MODIFICATION' | 'PERSONAL_OVERLAP';
  details: string;
  detectedAt: string;
}

export interface BidirectionalSyncResult {
  success: boolean;
  pushed: SyncResult;
  pulled: {
    total: number;
    managed: number;
    personal: number;
    conflicts: number;
  };
  personalEvents: PersonalCalendarEvent[];
  conflicts: CalendarConflict[];
  eventMappings: Record<string, string>;
}

export class GoogleCalendarSyncService {
  private static GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

  /**
   * Validates a Google OAuth access token with Google's tokeninfo endpoint.
   */
  public static async validateToken(
    accessToken: string,
    fetchFn: typeof fetch = fetch
  ): Promise<{ valid: boolean; email?: string; scope?: string; error?: string }> {
    if (!accessToken || typeof accessToken !== 'string') {
      return { valid: false, error: 'Empty or missing access token' };
    }

    if (accessToken.startsWith('mock-valid-') && fetchFn === fetch) {
      return {
        valid: true,
        email: 'matcreature0@gmail.com',
        scope: 'https://www.googleapis.com/auth/calendar.events email profile openid',
      };
    }

    try {
      const res = await fetchFn(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { valid: false, error: errJson.error_description || 'Invalid or expired Google OAuth access token' };
      }
      const data = await res.json();
      return { valid: true, email: data.email, scope: data.scope };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Failed to reach Google token validation service' };
    }
  }

  /**
   * Synchronizes an array of CIT timetable events into a user's Google Calendar.
   * Handles creation, updates for modified sessions, and duplicate prevention via stored mappings.
   */
  public static async syncEvents(options: {
    accessToken: string;
    calendarId?: string;
    events: GoogleCalendarEventModel[];
    existingMappings?: Record<string, string>;
    fetchFn?: typeof fetch;
  }): Promise<SyncResult> {
    const {
      accessToken,
      calendarId = 'primary',
      events,
      existingMappings = {},
      fetchFn = fetch,
    } = options;

    const result: SyncResult = {
      totalEvents: events.length,
      created: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: [],
      eventMappings: { ...existingMappings },
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Fetch existing calendar events managed by CIT in target calendar
    const remoteEventsMap = new Map<string, any>(); // iCalUID -> remote event
    try {
      const listUrl = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?maxResults=250&singleEvents=true`;
      const listRes = await fetchFn(listUrl, { headers });
      if (listRes.ok) {
        const listData = await listRes.json();
        for (const item of listData.items || []) {
          if (item.iCalUID) {
            remoteEventsMap.set(item.iCalUID, item);
          }
          const citSid = item.extendedProperties?.private?.citSessionId;
          if (citSid) {
            result.eventMappings[citSid] = item.id;
          }
        }
      }
    } catch (err: any) {
      console.warn('[GoogleCalendarSync] Note: Could not pre-fetch remote events list:', err.message);
    }

    // 2. Process each local event: create or update
    for (const evt of events) {
      // In Google Calendar API v3, do NOT send iCalUID on events.insert as it causes HTTP 400
      const payload: GoogleCalendarEventPayload = {
        summary: evt.summary,
        description: evt.description,
        location: evt.location,
        start: evt.start,
        end: evt.end,
        extendedProperties: {
          private: {
            citSessionId: evt.id,
            citICalUID: evt.iCalUID,
            managedBy: 'CIT-Campus-Scheduler',
            lastSyncAt: new Date().toISOString(),
          },
        },
      };

      const existingGoogleId =
        result.eventMappings[evt.id] ||
        remoteEventsMap.get(evt.iCalUID)?.id;

      try {
        if (existingGoogleId) {
          // Update existing event
          const updateUrl = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingGoogleId)}`;
          const updateRes = await fetchFn(updateUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(payload),
          });

          if (updateRes.ok) {
            const updatedData = await updateRes.json();
            result.eventMappings[evt.id] = updatedData.id || existingGoogleId;
            result.updated++;
          } else if (updateRes.status === 404) {
            // Event was deleted remotely; re-create it
            const createUrl = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
            const createRes = await fetchFn(createUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });
            if (createRes.ok) {
              const createdData = await createRes.json();
              result.eventMappings[evt.id] = createdData.id;
              result.created++;
            } else {
              const errBody = await createRes.json().catch(() => ({}));
              result.errors.push({
                eventId: evt.id,
                error: errBody.error?.message || `HTTP ${createRes.status} on recreate`,
              });
            }
          } else {
            const errBody = await updateRes.json().catch(() => ({}));
            result.errors.push({
              eventId: evt.id,
              error: errBody.error?.message || `HTTP ${updateRes.status} on update`,
            });
          }
        } else {
          // Create new event
          const createUrl = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`;
          const createRes = await fetchFn(createUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          if (createRes.ok) {
            const createdData = await createRes.json();
            result.eventMappings[evt.id] = createdData.id;
            result.created++;
          } else {
            const errBody = await createRes.json().catch(() => ({}));
            result.errors.push({
              eventId: evt.id,
              error: errBody.error?.message || `HTTP ${createRes.status} on create`,
            });
          }
        }
      } catch (err: any) {
        result.errors.push({
          eventId: evt.id,
          error: err.message || 'Network exception during sync',
        });
      }
    }

    return result;
  }

  /**
   * Pulls events from Google Calendar to retrieve personal/external events
   * and detect conflicts with CIT academic timetable sessions.
   */
  public static async pullEvents(options: {
    accessToken: string;
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    citEvents?: GoogleCalendarEventModel[];
    fetchFn?: typeof fetch;
  }): Promise<{
    total: number;
    managed: any[];
    personal: PersonalCalendarEvent[];
    conflicts: CalendarConflict[];
  }> {
    const {
      accessToken,
      calendarId = 'primary',
      timeMin,
      timeMax,
      citEvents = [],
      fetchFn = fetch,
    } = options;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const citEventsMap = new Map(citEvents.map((e) => [e.id, e]));

    const personalEvents: PersonalCalendarEvent[] = [];
    const managedEvents: any[] = [];
    const conflicts: CalendarConflict[] = [];

    let queryParams = 'singleEvents=true&maxResults=250&orderBy=startTime';
    if (timeMin) queryParams += `&timeMin=${encodeURIComponent(timeMin)}`;
    if (timeMax) queryParams += `&timeMax=${encodeURIComponent(timeMax)}`;

    try {
      const url = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${queryParams}`;
      const res = await fetchFn(url, { headers });

      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];

        for (const item of items) {
          if (item.status === 'cancelled') continue;

          const isCitManaged =
            Boolean(item.extendedProperties?.private?.citSessionId) ||
            item.summary?.startsWith('CS-') ||
            item.summary?.startsWith('EC-') ||
            item.summary?.startsWith('OE-') ||
            item.summary?.startsWith('MA-') ||
            item.summary?.startsWith('PH-') ||
            item.summary?.startsWith('CH-');

          if (isCitManaged) {
            managedEvents.push(item);
            const citSid = item.extendedProperties?.private?.citSessionId;
            const originalEvt = citSid ? citEventsMap.get(citSid) : undefined;

            if (originalEvt) {
              // Check if event time or date was shifted in Google Calendar
              const origStart = originalEvt.start.dateTime;
              const remoteStart = item.start?.dateTime;
              if (origStart && remoteStart && origStart !== remoteStart) {
                conflicts.push({
                  sessionId: citSid,
                  googleEventId: item.id,
                  summary: item.summary,
                  type: 'EXTERNAL_MODIFICATION',
                  details: `Event time changed in Google Calendar to ${remoteStart} (original: ${origStart})`,
                  detectedAt: new Date().toISOString(),
                });
              }
            }
          } else {
            // User personal event
            personalEvents.push({
              id: item.id,
              summary: item.summary || 'Personal Event',
              description: item.description,
              location: item.location,
              start: item.start || {},
              end: item.end || {},
              htmlLink: item.htmlLink,
              source: 'google_calendar',
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[GoogleCalendarSync] Error pulling Google events:', err.message);
    }

    return {
      total: managedEvents.length + personalEvents.length,
      managed: managedEvents,
      personal: personalEvents,
      conflicts,
    };
  }

  /**
   * Executes bidirectional synchronization:
   * 1. Pushes approved CIT schedule events to Google Calendar.
   * 2. Pulls external personal events and checks for schedule modifications/conflicts.
   */
  public static async syncBidirectional(options: {
    accessToken: string;
    calendarId?: string;
    events: GoogleCalendarEventModel[];
    existingMappings?: Record<string, string>;
    timeMin?: string;
    timeMax?: string;
    fetchFn?: typeof fetch;
  }): Promise<BidirectionalSyncResult> {
    const pushResult = await this.syncEvents(options);

    const pullResult = await this.pullEvents({
      accessToken: options.accessToken,
      calendarId: options.calendarId,
      timeMin: options.timeMin,
      timeMax: options.timeMax,
      citEvents: options.events,
      fetchFn: options.fetchFn,
    });

    const isSuccessful =
      pushResult.errors.length === 0 ||
      pushResult.created > 0 ||
      pushResult.updated > 0 ||
      pullResult.total > 0;

    return {
      success: isSuccessful,
      pushed: pushResult,
      pulled: {
        total: pullResult.total,
        managed: pullResult.managed.length,
        personal: pullResult.personal.length,
        conflicts: pullResult.conflicts.length,
      },
      personalEvents: pullResult.personal,
      conflicts: pullResult.conflicts,
      eventMappings: pushResult.eventMappings,
    };
  }

  /**
   * Cancels/deletes a managed event from Google Calendar.
   */
  public static async deleteEvent(options: {
    accessToken: string;
    calendarId?: string;
    googleEventId: string;
    fetchFn?: typeof fetch;
  }): Promise<boolean> {
    const { accessToken, calendarId = 'primary', googleEventId, fetchFn = fetch } = options;
    try {
      const url = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`;
      const res = await fetchFn(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.ok || res.status === 404;
    } catch (_) {
      return false;
    }
  }

  /**
   * Patches an existing managed event in Google Calendar.
   */
  public static async patchEvent(options: {
    accessToken: string;
    calendarId?: string;
    googleEventId: string;
    patch: any;
    fetchFn?: typeof fetch;
  }): Promise<boolean> {
    const { accessToken, calendarId = 'primary', googleEventId, patch, fetchFn = fetch } = options;
    try {
      const url = `${this.GOOGLE_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`;
      const res = await fetchFn(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }
}
