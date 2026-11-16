# Dodaje do lines.js dane odcinków z GTFS shapes.txt:
#   dir.seg[i] = [długość po trasie w m, [[ułamek odcinka, kierunek(1=lewo,-1=prawo), kąt°], ...]]
import csv, json, math, io, sys, collections
GT = sys.argv[1]; LJ = sys.argv[2]
src = io.open(LJ, encoding='utf-8').read()
head, body = src.split('window.LINES=', 1)
LINES = json.loads(body.strip().rstrip(';'))

route_shapes = collections.defaultdict(set)
with io.open(GT + '/trips.txt', encoding='utf-8-sig') as f:
    for r in csv.DictReader(f): route_shapes[r['route_id']].add(r['shape_id'])
need = set(s for v in route_shapes.values() for s in v)
shapes = collections.defaultdict(list)
with io.open(GT + '/shapes.txt', encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        if r['shape_id'] in need: shapes[r['shape_id']].append((int(r['shape_pt_sequence']), float(r['shape_pt_lat']), float(r['shape_pt_lon'])))

LAT0 = 51.11; KX = 111320 * math.cos(math.radians(LAT0)); KY = 110540
def xy(lat, lon): return (lon * KX, lat * KY)
prep = {}
def get_shape(sid):
    if sid in prep: return prep[sid]
    pts = [xy(a, b) for _, a, b in sorted(shapes[sid])]
    P = [pts[0]]
    for p in pts[1:]:
        if math.dist(p, P[-1]) > 0.5: P.append(p)
    S = [0.0]
    for i in range(1, len(P)): S.append(S[-1] + math.dist(P[i - 1], P[i]))
    prep[sid] = (P, S); return P, S

def project(P, S, q, smin):
    best = (1e18, None)
    for i in range(len(P) - 1):
        if S[i + 1] < smin: continue
        (ax, ay), (bx, by) = P[i], P[i + 1]; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
        t = max(0, min(1, ((q[0] - ax) * dx + (q[1] - ay) * dy) / L2))
        s = S[i] + t * (S[i + 1] - S[i])
        if s < smin: continue
        d = math.hypot(ax + t * dx - q[0], ay + t * dy - q[1])
        c = d + 0.01 * (s - smin)
        if c < best[0]: best = (c, (s, d))
    return best[1]

def at(P, S, s):
    s = max(0, min(S[-1], s)); lo, hi = 0, len(S) - 1
    while hi - lo > 1:
        m = (lo + hi) // 2
        if S[m] <= s: lo = m
        else: hi = m
    t = (s - S[lo]) / max(1e-9, S[hi] - S[lo])
    return (P[lo][0] + t * (P[hi][0] - P[lo][0]), P[lo][1] + t * (P[hi][1] - P[lo][1]))

def ang(P, S, s, arm):
    a, b, c = at(P, S, s - arm), at(P, S, s), at(P, S, s + arm)
    ux, uy, vx, vy = b[0] - a[0], b[1] - a[1], c[0] - b[0], c[1] - b[1]
    if math.hypot(ux, uy) < arm * 0.5 or math.hypot(vx, vy) < arm * 0.5: return 0
    return math.degrees(math.atan2(ux * vy - uy * vx, ux * vx + uy * vy))

TH, ARM, STEP = 40, 20, 5
def turns(P, S):
    out = []; s = ARM; vals = []
    while s < S[-1] - ARM: vals.append((s, ang(P, S, s, ARM))); s += STEP
    i = 0
    while i < len(vals):
        if abs(vals[i][1]) >= TH:
            j = i
            while j + 1 < len(vals) and abs(vals[j + 1][1]) >= TH and math.copysign(1, vals[j + 1][1]) == math.copysign(1, vals[i][1]): j += 1
            k = max(range(i, j + 1), key=lambda q: abs(vals[q][1]))
            sc = vals[k][0]; full = ang(P, S, sc, 35)
            if TH <= abs(full) <= 150 and (not out or sc - out[-1][0] > 45): out.append((sc, 1 if full > 0 else -1, round(abs(full))))
            i = j + 1
        else: i += 1
    return out

stats = collections.Counter()
for ln, L in LINES.items():
    for D in L['dirs']:
        Q = [xy(s[1], s[2]) for s in D['stops']]
        best = None
        for sid in route_shapes.get(ln, ()):
            P, S = get_shape(sid); smin = 0; proj = []; ok = True
            for q in Q:
                r = project(P, S, q, smin)
                if not r: ok = False; break
                proj.append(r); smin = r[0]
            if not ok: continue
            mx = max(d for _, d in proj); mean = sum(d for _, d in proj) / len(proj)
            if mx < 120 and (best is None or mean < best[0]): best = (mean, sid, proj)
        if not best:
            stats['noshape'] += 1; D.pop('seg', None); continue
        P, S = get_shape(best[1]); sp = [p[0] for p in best[2]]; T = turns(P, S); seg = []
        for i in range(len(sp) - 1):
            a, b = sp[i], sp[i + 1]; L_ = max(1, b - a)
            tt = [[round((s - a) / L_, 3), d, g] for s, d, g in T if a < s <= b]
            seg.append([round(L_), tt]); stats['turns'] += len(tt)
        stats['ok'] += 1; D['seg'] = seg
print(dict(stats), file=sys.stderr)
io.open(LJ, 'w', encoding='utf-8', newline='').write(head + 'window.LINES=' + json.dumps(LINES, ensure_ascii=False, separators=(',', ':')) + ';\n')
