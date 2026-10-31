import assert from 'assert';

// Simulated event structure from GoogleStyleCalendar
interface CalendarEventItem {
  id: string;
  courseId?: string;
  summary: string;
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startHourFraction: number;
  endHourFraction: number;
  duration?: number;
}

interface PositionedCalendarEventItem extends CalendarEventItem {
  colIndex: number;
  totalCols: number;
  colSpan?: number;
}

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

function calculateEventLayout(events: CalendarEventItem[]): PositionedCalendarEventItem[] {
  const dayGroups: Record<string, CalendarEventItem[]> = {};
  for (const d of DAY_NAMES) dayGroups[d] = [];

  for (const ev of events) {
    if (dayGroups[ev.day]) {
      dayGroups[ev.day].push(ev);
    }
  }

  const positionedEvents: PositionedCalendarEventItem[] = [];

  for (const day of DAY_NAMES) {
    const dayEvts = [...dayGroups[day]].sort(
      (a, b) => a.startHourFraction - b.startHourFraction || b.endHourFraction - a.endHourFraction
    );

    // 1. Partition into connected overlapping clusters
    const clusters: CalendarEventItem[][] = [];
    let currentCluster: CalendarEventItem[] = [];
    let clusterMaxEnd = -1;

    for (const ev of dayEvts) {
      if (currentCluster.length === 0) {
        currentCluster.push(ev);
        clusterMaxEnd = ev.endHourFraction;
      } else if (ev.startHourFraction < clusterMaxEnd) {
        currentCluster.push(ev);
        clusterMaxEnd = Math.max(clusterMaxEnd, ev.endHourFraction);
      } else {
        clusters.push(currentCluster);
        currentCluster = [ev];
        clusterMaxEnd = ev.endHourFraction;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // 2. Greedily assign columns and spans within each independent cluster
    for (const cluster of clusters) {
      const clusterCols: CalendarEventItem[][] = [];
      const eventColMap = new Map<string, number>();

      for (const ev of cluster) {
        let placedCol = -1;
        for (let c = 0; c < clusterCols.length; c++) {
          const lastEv = clusterCols[c][clusterCols[c].length - 1];
          if (lastEv.endHourFraction <= ev.startHourFraction) {
            clusterCols[c].push(ev);
            placedCol = c;
            break;
          }
        }
        if (placedCol === -1) {
          clusterCols.push([ev]);
          placedCol = clusterCols.length - 1;
        }
        eventColMap.set(ev.id, placedCol);
      }

      const numCols = Math.max(1, clusterCols.length);

      for (const ev of cluster) {
        const colIndex = eventColMap.get(ev.id) ?? 0;

        let colSpan = 1;
        while (colIndex + colSpan < numCols) {
          const nextCol = clusterCols[colIndex + colSpan];
          const hasConflict = nextCol.some(
            (other) => other.startHourFraction < ev.endHourFraction && other.endHourFraction > ev.startHourFraction
          );
          if (!hasConflict) {
            colSpan++;
          } else {
            break;
          }
        }

        positionedEvents.push({
          ...ev,
          colIndex,
          totalCols: numCols,
          colSpan,
        });
      }
    }
  }

  return positionedEvents;
}

function runTests() {
  console.log('--- RUNNING WEEK VIEW LAYOUT ALGORITHM TESTS ---');

  // Test 1: Isolated non-overlapping events should get totalCols = 1, colSpan = 1
  const t1Events: CalendarEventItem[] = [
    { id: 'ev1', summary: 'Math', day: 'MON', startHourFraction: 9, endHourFraction: 10 },
    { id: 'ev2', summary: 'Physics', day: 'MON', startHourFraction: 11, endHourFraction: 12 },
    { id: 'ev3', summary: 'Chemistry', day: 'MON', startHourFraction: 14, endHourFraction: 15 },
  ];
  const t1Res = calculateEventLayout(t1Events);
  assert.strictEqual(t1Res.length, 3);
  t1Res.forEach((e) => {
    assert.strictEqual(e.totalCols, 1, `${e.id} should have totalCols = 1`);
    assert.strictEqual(e.colIndex, 0, `${e.id} should have colIndex = 0`);
  });
  console.log('✓ Test 1 Passed: Isolated non-overlapping events take full column width (totalCols = 1)');

  // Test 2: Two overlapping events get totalCols = 2, colIndex = 0 and 1
  const t2Events: CalendarEventItem[] = [
    { id: 'evA', summary: 'CS-501', day: 'MON', startHourFraction: 9, endHourFraction: 10 },
    { id: 'evB', summary: 'EC-301', day: 'MON', startHourFraction: 9, endHourFraction: 10 },
  ];
  const t2Res = calculateEventLayout(t2Events);
  assert.strictEqual(t2Res[0].totalCols, 2);
  assert.strictEqual(t2Res[1].totalCols, 2);
  assert.strictEqual(t2Res[0].colIndex, 0);
  assert.strictEqual(t2Res[1].colIndex, 1);
  console.log('✓ Test 2 Passed: Exactly two overlapping events placed side by side (totalCols = 2)');

  // Test 3: Unrelated class at 2:00 PM does not get squeezed by morning overlap
  const t3Events: CalendarEventItem[] = [
    { id: 'morn1', summary: 'Morning 1', day: 'TUE', startHourFraction: 9, endHourFraction: 10 },
    { id: 'morn2', summary: 'Morning 2', day: 'TUE', startHourFraction: 9, endHourFraction: 10 },
    { id: 'morn3', summary: 'Morning 3', day: 'TUE', startHourFraction: 9, endHourFraction: 10 },
    { id: 'afternoon', summary: 'Afternoon Solitary', day: 'TUE', startHourFraction: 14, endHourFraction: 15 },
  ];
  const t3Res = calculateEventLayout(t3Events);
  const aft = t3Res.find((e) => e.id === 'afternoon')!;
  assert.strictEqual(aft.totalCols, 1, 'Afternoon solitary event should NOT be affected by morning 3-way overlap');
  assert.strictEqual(aft.colIndex, 0);
  console.log('✓ Test 3 Passed: Morning overlaps do not affect afternoon events (clustering independence)');

  // Test 4: Different days remain strictly isolated
  const t4Events: CalendarEventItem[] = [
    { id: 'mon', summary: 'Monday Class', day: 'MON', startHourFraction: 9, endHourFraction: 10 },
    { id: 'tue', summary: 'Tuesday Class', day: 'TUE', startHourFraction: 9, endHourFraction: 10 },
  ];
  const t4Res = calculateEventLayout(t4Events);
  const monEv = t4Res.find((e) => e.id === 'mon')!;
  const tueEv = t4Res.find((e) => e.id === 'tue')!;
  assert.strictEqual(monEv.day, 'MON');
  assert.strictEqual(tueEv.day, 'TUE');
  assert.strictEqual(monEv.totalCols, 1);
  assert.strictEqual(tueEv.totalCols, 1);
  console.log('✓ Test 4 Passed: Events on different days remain strictly inside their respective day groups');

  // Test 5: Mixed durations (2-hour Lab vs two 1-hour lectures)
  const t5Events: CalendarEventItem[] = [
    { id: 'lab', summary: 'CS-501L (2 hr lab)', day: 'WED', startHourFraction: 10, endHourFraction: 12, duration: 2 },
    { id: 'lec1', summary: 'Lec 1', day: 'WED', startHourFraction: 10, endHourFraction: 11, duration: 1 },
    { id: 'lec2', summary: 'Lec 2', day: 'WED', startHourFraction: 11, endHourFraction: 12, duration: 1 },
  ];
  const t5Res = calculateEventLayout(t5Events);
  const lab = t5Res.find((e) => e.id === 'lab')!;
  const lec1 = t5Res.find((e) => e.id === 'lec1')!;
  const lec2 = t5Res.find((e) => e.id === 'lec2')!;
  assert.strictEqual(lab.colIndex, 0);
  assert.strictEqual(lec1.colIndex, 1);
  assert.strictEqual(lec2.colIndex, 1, 'Lec 2 should reuse column 1 after Lec 1 completes at 11:00');
  assert.strictEqual(lab.totalCols, 2);
  assert.strictEqual(lec1.totalCols, 2);
  assert.strictEqual(lec2.totalCols, 2);
  console.log('✓ Test 5 Passed: Multi-hour lab and sequential 1-hour lectures reuse columns cleanly');

  console.log('--- ALL CALENDAR WEEK LAYOUT TESTS PASSED! ---');
}

runTests();
