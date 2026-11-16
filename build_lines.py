# Generator lines.js z GTFS MPK Wrocław (Otwarte Dane Wrocław).
# Użycie: python build_lines.py <katalog_gtfs> lines.js [RRRRMMDD]
# Bez daty wybiera pierwszy wtorek z okresu ważności feedu (dzień roboczy).
import csv, io, sys, os, json, math, datetime, collections, subprocess

GT, OUT = sys.argv[1], sys.argv[2]
def rows(name):
    with io.open(os.path.join(GT, name), encoding='utf-8-sig') as f: yield from csv.DictReader(f)
def d8(s): return datetime.date(int(s[:4]), int(s[4:6]), int(s[6:]))

# --- dzień obsługi
cal = list(rows('calendar.txt'))
cd = list(rows('calendar_dates.txt')) if os.path.exists(os.path.join(GT, 'calendar_dates.txt')) else []
if len(sys.argv) > 3: day = d8(sys.argv[3])
else:
    lo = min(d8(c['start_date']) for c in cal); hi = max(d8(c['end_date']) for c in cal)
    day = max(lo, datetime.date.today())
    while day.weekday() != 1 and day < hi: day += datetime.timedelta(days=1)
wd = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][day.weekday()]
ds = day.strftime('%Y%m%d')
svc = {c['service_id'] for c in cal if c[wd] == '1' and d8(c['start_date']) <= day <= d8(c['end_date'])}
for c in cd:
    if c['date'] == ds: (svc.add if c['exception_type'] == '1' else svc.discard)(c['service_id'])
fi = next(rows('feed_info.txt'), {}) if os.path.exists(os.path.join(GT, 'feed_info.txt')) else {}

# --- dane
routes = {r['route_id']: r for r in rows('routes.txt')}
stops = {s['stop_id']: (s['stop_name'].strip(), round(float(s['stop_lat']), 5), round(float(s['stop_lon']), 5)) for s in rows('stops.txt')}
trips = {t['trip_id']: t for t in rows('trips.txt') if t['service_id'] in svc and t['route_id'] in routes}
st = collections.defaultdict(list)
def sec(h):
    a, b, c = h.split(':'); return int(a) * 3600 + int(b) * 60 + int(c)
for r in rows('stop_times.txt'):
    if r['trip_id'] in trips: st[r['trip_id']].append((int(r['stop_sequence']), r['stop_id'], sec(r['departure_time'] or r['arrival_time'])))
shp = collections.defaultdict(list)
for r in rows('shapes.txt'): shp[r['shape_id']].append((int(r['shape_pt_sequence']), float(r['shape_pt_lat']), float(r['shape_pt_lon'])))

def dp(P, eps):
    if len(P) < 3: return P
    a, b = P[0], P[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-12
    k, dm = 0, -1
    for i in range(1, len(P) - 1):
        d = abs(dy * (P[i][0] - a[0]) - dx * (P[i][1] - a[1])) / L
        if d > dm: k, dm = i, d
    return dp(P[:k + 1], eps)[:-1] + dp(P[k:], eps) if dm > eps else [a, b]

# --- linie
by = collections.defaultdict(lambda: collections.defaultdict(list))
for tid, t in trips.items():
    if st[tid]: by[t['route_id']][t['direction_id']].append(tid)
LINES = {}
for rid, dirs in by.items():
    rt = routes[rid]['route_type']; typ = 'tram' if rt == '0' else 'bus' if rt == '3' else None
    if not typ: continue
    out = []
    for did in sorted(dirs):
        T = dirs[did]
        for tid in T: st[tid].sort()
        # wzorzec: najczęstszy wariant, z pominięciem kursów do/z zajezdni
        cnt = collections.Counter(tuple(s[1] for s in st[tid]) for tid in T)
        depot = lambda p: 'zajezdnia' in (stops[p[0]][0] + stops[p[-1]][0]).lower()
        pool = [p for p in cnt if not depot(p)] or list(cnt)
        pat = max(pool, key=lambda p: (cnt[p], len(p)))
        cand = [tid for tid in T if tuple(s[1] for s in st[tid]) == pat]
        rep = min(cand, key=lambda tid: abs(st[tid][0][2] - 12 * 3600))
        s0 = st[rep][0][2]
        S = [[stops[sid][0], stops[sid][1], stops[sid][2], round((tt - s0) / 60)] for _, sid, tt in st[rep]]
        first = stops[pat[0]][0]
        deps = sorted({st[tid][0][2] // 60 for tid in T if stops[st[tid][0][1]][0] == first})
        sid = trips[rep]['shape_id']; P = [(a, b) for _, a, b in sorted(shp.get(sid, []))]
        shape = [[round(a, 5), round(b, 5)] for a, b in dp(P, 0.00025)] if P else [[s[1], s[2]] for s in S]
        out.append({'head': (trips[rep]['trip_headsign'] or S[-1][0]).strip().upper(), 'stops': S, 'deps': deps, 'shape': shape})
    if len(out) == 1: out.append(json.loads(json.dumps(out[0])))
    LINES[routes[rid]['route_short_name'].strip()] = {'type': typ, 'dirs': out[:2]}

def key(n):
    if n.isdigit() and int(n) < 100: return (0, int(n), n)
    if not n.isdigit(): return (1, 0, n)
    return (2, int(n), n)
LINES = {k: LINES[k] for k in sorted(LINES, key=key)}
v0, v1 = fi.get('feed_start_date', ''), fi.get('feed_end_date', '')
rng = f'{v0[6:8]}.{v0[4:6]}–{v1[6:8]}.{v1[4:6]}.{v1[:4]}' if v0 and v1 else '?'
hdr = f'// Dane: Otwarte Dane Wrocław (GTFS MPK, ważne {rng}), dzień roboczy {day.strftime("%d.%m.%Y")}\n'
io.open(OUT, 'w', encoding='utf-8', newline='').write(hdr + 'window.LINES=' + json.dumps(LINES, ensure_ascii=False, separators=(',', ':')) + ';\n')
nt = sum(1 for L in LINES.values() if L['type'] == 'tram')
print(f'dzień {ds}, linie: {len(LINES)} ({nt} tram, {len(LINES) - nt} bus), feed {rng}', file=sys.stderr)
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_segs.py'), GT, OUT], check=True)
