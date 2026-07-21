/*!
 * Nacre.js — 나전칠기(자개) 광학 시뮬레이션
 *
 * 진주층(nacre)의 구조색을 물리 기반으로 근사한다:
 *  1) 아라고나이트 판(두께 ~400–500nm, n≈1.63)과 유기층(콘키올린, n≈1.43)이
 *     쌓인 다층 박막 구조 → 브래그 간섭
 *  2) 광로차 OPD = 2(n1·d1·cosθ1 + n2·d2·cosθ2), 파장별 보강/상쇄
 *     N층 간섭 세기 = sin²(Nφ/2) / (N²·sin²(φ/2)),  φ = 2π·OPD/λ
 *  3) 가시광 스펙트럼(400–700nm)을 CIE 1931 등색함수로 적분 → XYZ → sRGB
 *  4) 시야각·광원각에 따라 OPD가 줄어 색이 단파장 쪽으로 이동
 *     → 포인터/기울임으로 각도를 바꾸면 실물처럼 색이 흐른다
 *
 * 스타일 프리셋:
 *   'lacquer' — 검은 옻칠 위 자개 상감. 보로노이 판 도메인, 어두운 이음매,
 *               광원 주변에서만 빛나는 조각들.
 *               조절값: thickness(색조)·variance(두께 균일도, 낮을수록 일관된 파랑)
 *                      ·layers·scale·iridescence·tint 등.
 *   'sheet'   — 염색 자개 시트(샘플: 블루). 큰 판상조각(보로노이)마다 제각기
 *               다른 방향의 결이 흐르고, 층수를 낮춰 파스텔 간섭색.
 *               조절값: tint(염색색)·flow(결 방향)·flowVar(조각별 방향 편차)·streak(결 밀도)
 *                      ·contrast(결 명암)·sheen(흰 광)·thickness·layers 등.
 *
 * API:
 *   Nacre.attach(elOrCanvas, options)  → WebGL 배경/패널 인스턴스
 *   Nacre.text(selectorOrEl, options)  → 텍스트 하이라이트(그라디언트, GL 불필요)
 *   Nacre.color(dNm, cosTheta, layers) → 간섭색 CSS 문자열 (커스텀 용도)
 *   Nacre.auto()                       → [data-nacre], [data-nacre-text] 자동 초기화
 */
(function (root) {
  'use strict';

  var N1 = 1.63;      // 아라고나이트 굴절률
  var N2 = 1.43;      // 콘키올린(유기층) 굴절률
  var ORGANIC = 0.18; // 유기층 두께 / 판 두께 비율

  /* ---------------- 물리 코어 (JS) — 텍스트 하이라이트·색 API용 ---------------- */

  // 조각 가우시안 — CIE 1931 등색함수의 다중 가우시안 근사(Wyman et al. 2013)
  function gpw(x, mu, s1, s2) {
    var s = x < mu ? s1 : s2, t = (x - mu) / s;
    return Math.exp(-0.5 * t * t);
  }
  function cmf(l) { // [x̄, ȳ, z̄]
    return [
      1.056 * gpw(l, 599.8, 37.9, 31.0) + 0.362 * gpw(l, 442.0, 16.0, 26.7) - 0.065 * gpw(l, 501.1, 20.4, 26.2),
      0.821 * gpw(l, 568.8, 46.9, 40.5) + 0.286 * gpw(l, 530.9, 16.3, 31.1),
      1.217 * gpw(l, 437.0, 11.8, 36.0) + 0.681 * gpw(l, 459.0, 26.0, 13.8)
    ];
  }
  function cosRefract(cosI, n) { // 스넬 법칙: 매질 내부의 cosθ
    var s2 = (1 - cosI * cosI) / (n * n);
    return Math.sqrt(Math.max(1 - s2, 0));
  }
  // N층 브래그 스택 간섭 세기 (φ=2πm에서 1로 정규화, k는 0/0 극한 안정화)
  function stack(phi, layers) {
    var s = Math.sin(phi * 0.5), t = Math.sin(phi * 0.5 * layers), k = 1.5e-3;
    return (t * t + k) / (s * s * layers * layers + k);
  }
  // 두께 d(nm), 공기 중 입사각 cosθ, 층수 → 선형 RGB(감마 전, 0~)
  function iridescence(d, cosI, layers) {
    var c1 = cosRefract(cosI, N1), c2 = cosRefract(cosI, N2);
    var opd = 2 * (N1 * d * c1 + N2 * d * ORGANIC * c2);
    var X = 0, Y = 0, Z = 0, S = 16, i, l, R, c;
    for (i = 0; i < S; i++) {
      l = 400 + 300 * (i + 0.5) / S;
      R = stack(2 * Math.PI * opd / l, layers);
      c = cmf(l);
      X += c[0] * R; Y += c[1] * R; Z += c[2] * R;
    }
    X /= S; Y /= S; Z /= S;
    var rgb = [
      3.2406 * X - 1.5372 * Y - 0.4986 * Z,
      -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
      0.0557 * X - 0.2040 * Y + 1.0570 * Z
    ];
    for (i = 0; i < 3; i++) rgb[i] = Math.max(rgb[i], 0);
    return rgb;
  }
  function tonemap(rgb, exposure) {
    return rgb.map(function (v) {
      return Math.pow(1 - Math.exp(-v * exposure), 1 / 2.2);
    });
  }
  function color(d, cosI, layers, exposure) {
    var c = tonemap(iridescence(d, cosI, layers || 6), exposure || 2.6)
      .map(function (v) { return Math.round(Math.min(v, 1) * 255); });
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }

  // '#rrggbb' 또는 [r,g,b](선형 0~1) → 선형 RGB 배열
  function normTint(tint) {
    if (!tint) return null;
    if (Array.isArray(tint)) return tint;
    var m = /^#?([0-9a-f]{6})$/i.exec(String(tint));
    if (!m) return null;
    var v = parseInt(m[1], 16);
    return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]
      .map(function (c) { return Math.pow(c, 2.2); });
  }

  /* ---------------- 공용 포인터 상태 (모든 인스턴스가 같은 광원각을 공유) ---------------- */

  var pointer = { x: 0, y: 0, tx: 0.25, ty: 0.2 };
  var pointerBound = false;
  function bindPointer() {
    if (pointerBound || typeof window === 'undefined') return;
    pointerBound = true;
    window.addEventListener('pointermove', function (e) {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    // 모바일: 기기 기울임 → 광원각 (실물 자개를 기울이는 것과 동일한 상호작용)
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null) return;
      pointer.tx = Math.max(-1, Math.min(1, e.gamma / 35));
      pointer.ty = Math.max(-1, Math.min(1, (30 - e.beta) / 35));
    }, { passive: true });
  }

  var reducedMotion = typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- WebGL 셰이더 ---------------- */

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  // 공통: 노이즈·보로노이·CIE 적분 (두 스타일이 같은 물리를 공유)
  var FRAG_COMMON = [
    'precision highp float;',
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform vec2  uPointer;',
    'uniform float uScale;',
    'uniform float uThick;',
    'uniform float uLayers;',
    'uniform float uIrid;',
    'uniform float uSeed;',
    'uniform float uExposure;',
    'uniform vec3  uTint;',
    'uniform float uFlow;',      // 결 기준 방향(라디안) — sheet 전용
    'uniform float uFlowVar;',   // 조각별 결 방향 편차
    'uniform float uStreak;',    // 결 밀도
    'uniform float uSheen;',     // 흰 광 세기
    'uniform float uContrast;',  // 결 명암 대비
    'uniform float uPiece;',     // 조각 평균 크기 배율 (1 = 기본, 클수록 큼)
    'uniform float uVar;',       // 판 두께·기울기 변동량 (lacquer) — 낮을수록 색이 균일
    'const float N1 = 1.63;',      // 아라고나이트
    'const float N2 = 1.43;',      // 콘키올린
    'const float ORGANIC = 0.18;',
    'const int   SPEC = 14;',      // 스펙트럼 샘플 수
    '',
    'float hash12(vec2 p){',
    '  p = fract(p*vec2(123.34, 456.21));',
    '  p += dot(p, p+45.32);',
    '  return fract(p.x*p.y);',
    '}',
    'vec2 hash22(vec2 p){',
    '  vec2 q = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));',
    '  return fract(sin(q)*43758.5453);',
    '}',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f*f*(3.0-2.0*f);',
    '  return mix(mix(hash12(i), hash12(i+vec2(1.0,0.0)), u.x),',
    '             mix(hash12(i+vec2(0.0,1.0)), hash12(i+vec2(1.0,1.0)), u.x), u.y);',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for(int i=0;i<4;i++){ v += a*vnoise(p); p = p*2.03 + vec2(19.19); a *= 0.5; }',
    '  return v;',
    '}',
    'vec2 rot(vec2 v, float a){',
    '  float c = cos(a), s = sin(a);',
    '  return vec2(c*v.x - s*v.y, s*v.x + c*v.y);',
    '}',
    /* 보로노이: 자개 판 도메인. id=셀, f1=중심거리, f2-f1=경계 근접도 */
    'void voronoi(vec2 p, out vec2 id, out float f1, out float f2){',
    '  vec2 n = floor(p), f = fract(p);',
    '  id = n; f1 = 8.0; f2 = 8.0;',
    '  for(int j=-1;j<=1;j++)',
    '  for(int i=-1;i<=1;i++){',
    '    vec2 g = vec2(float(i), float(j));',
    '    vec2 r = g + hash22(n+g) - f;',
    '    float d = dot(r,r);',
    '    if(d < f1){ f2 = f1; f1 = d; id = n+g; }',
    '    else if(d < f2){ f2 = d; }',
    '  }',
    '  f1 = sqrt(f1); f2 = sqrt(f2);',
    '}',
    /* CIE 1931 등색함수 근사 */
    'float gpw(float x, float mu, float s1, float s2){',
    '  float s = x < mu ? s1 : s2;',
    '  float t = (x-mu)/s;',
    '  return exp(-0.5*t*t);',
    '}',
    'vec3 cmf(float l){',
    '  return vec3(',
    '    1.056*gpw(l,599.8,37.9,31.0) + 0.362*gpw(l,442.0,16.0,26.7) - 0.065*gpw(l,501.1,20.4,26.2),',
    '    0.821*gpw(l,568.8,46.9,40.5) + 0.286*gpw(l,530.9,16.3,31.1),',
    '    1.217*gpw(l,437.0,11.8,36.0) + 0.681*gpw(l,459.0,26.0,13.8));',
    '}',
    'float cosRefract(float cosI, float n){',
    '  float s2 = (1.0 - cosI*cosI)/(n*n);',
    '  return sqrt(max(1.0 - s2, 0.0));',
    '}',
    /* N층 간섭 세기 sin²(Nφ/2)/(N²sin²(φ/2)) — k로 0/0 극한 안정화 */
    'float stackR(float phi, float layers){',
    '  float s = sin(phi*0.5);',
    '  float t = sin(phi*0.5*layers);',
    '  float k = 1.5e-3;',
    '  return (t*t + k)/(s*s*layers*layers + k);',
    '}',
    /* 두께 d(nm), 입사각 cosθ → 스펙트럼 적분 → 선형 sRGB */
    'vec3 iridescence(float d, float cosI, float layers){',
    '  float c1 = cosRefract(cosI, N1);',
    '  float c2 = cosRefract(cosI, N2);',
    '  float opd = 2.0*(N1*d*c1 + N2*d*ORGANIC*c2);',   // 광로차
    '  vec3 xyz = vec3(0.0);',
    '  for(int i=0;i<SPEC;i++){',
    '    float l = 400.0 + 300.0*(float(i)+0.5)/float(SPEC);',
    '    xyz += cmf(l) * stackR(6.2831853*opd/l, layers);',
    '  }',
    '  xyz /= float(SPEC);',
    '  vec3 rgb = vec3(',
    '     3.2406*xyz.x - 1.5372*xyz.y - 0.4986*xyz.z,',
    '    -0.9689*xyz.x + 1.8758*xyz.y + 0.0415*xyz.z,',
    '     0.0557*xyz.x - 0.2040*xyz.y + 1.0570*xyz.z);',
    '  return max(rgb, vec3(0.0));',
    '}'
  ].join('\n');

  // 스타일 1: 검은 옻칠 위 자개 상감
  var FRAG_LACQUER = [
    'void main(){',
    '  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x, uRes.y);',
    '  vec2 q = p*uScale + vec2(uSeed*13.7, uSeed*7.9);',
    '',
    '  vec2 id; float f1; float f2;',
    '  voronoi(q, id, f1, f2);',
    '  float edge = f2 - f1;',
    '',
    /* 껍데기 곡면(결): 저주파 노이즈 높이장의 기울기 */
    '  float e = 0.035;',
    '  float h  = fbm(q*0.35);',
    '  vec2 grad = vec2(fbm(q*0.35+vec2(e,0.0))-h, fbm(q*0.35+vec2(0.0,e))-h)/e;',
    '',
    /* 판마다 다른 미세 기울기 — uVar가 낮으면 조각들이 비슷한 각도로 정렬돼
       같은 간섭색을 반사한다(실물 자개의 판이 표면에 나란히 놓인 상태) */
    '  vec2 tilt = (hash22(id+3.1) - 0.5)*0.38*mix(0.35, 1.0, uVar);',
    '  vec3 Nrm = normalize(vec3(-grad*0.4 - tilt, 1.0));',
    '',
    /* 광원을 비스듬히: L·V가 벌어져야 특정 기울기의 판만 정반사를 잡는다 */
    '  vec3 V = normalize(vec3(-p*0.22, 1.0));',
    '  vec3 L = normalize(vec3(uPointer*1.4, 0.75));',
    '  vec3 H = normalize(V+L);',
    '',
    '  float cosNH = clamp(dot(Nrm,H), 0.0, 1.0);',
    '  float cosNV = clamp(dot(Nrm,V), 0.0, 1.0);',
    '  float align = clamp(dot(reflect(-L,Nrm), V), 0.0, 1.0);',
    '',
    /* 두께장: 성장 줄무늬 + 판별 편차 + 판 내부 테라스(두께 계단 → 프린지).
       실물 자개는 판 두께가 매우 균일해 단일 간섭색을 낸다 → uVar로 변동폭 조절.
       uVar↓ = 두께 균일 = 강하고 일관된 단색, uVar↑ = 무지개처럼 색 흩어짐 */
    '  float d = uThick * (1.0',
    '      + 0.24*(fbm(q*0.22 + vec2(31.7))*2.0 - 1.0)*uVar',
    '      + 0.09*(hash12(id)*2.0 - 1.0)*uVar);',
    '  d *= 1.0 + 0.02*sin(f1*13.0 + 4.0*vnoise(q*1.7) + hash12(id+9.1)*6.2831)*uVar;',
    '',
    /* 옻칠 바탕(선형 공간에서 진짜 어둡게) */
    '  vec3 col = uTint*(0.6 + 0.8*h);',
    '',
    /* 확산 구조색은 "평탄한" 법선으로 계산 → 실물처럼 판이 표면에 나란히 놓여
       화면 전체가 일관된 단색(파랑)을 낸다. uVar가 낮을수록 더 평탄=더 균일.
       울퉁불퉁한 Nrm은 정반사 반짝임(iridS)에만 남긴다. */
    '  vec3 Ndiff = normalize(vec3((-grad*0.4 - tilt)*mix(0.12, 1.0, uVar), 1.0));',
    /* cosNVd를 파랑이 가장 진한 좁은 구간(0.84~0.92)에 묶는다 — 넓은 각도에서
       청록이나 마젠타 고차 간섭색으로 넘어가는 것을 막아 일관된 파랑을 유지 */
    '  float cosNVd = mix(0.84, 0.92, clamp(dot(Ndiff, V), 0.0, 1.0));',
    '  vec3 iridA = iridescence(d, cosNVd, uLayers);',
    '  vec3 iridS = iridescence(d, cosNH, uLayers);',
    /* 광원에서 먼 곳은 옻칠의 어둠에 잠기도록 감쇠 (정반사각 + 광원 거리) */
    '  float spot = exp(-2.2*length(p - uPointer*0.45));',
    '  float lit = (0.15 + 0.85*pow(align, 2.0)) * mix(0.03, 1.0, spot);',
    /* 확산 구조색: 자개 조각이 화면을 채우는 파랑 (스팟 밖에서도 또렷이 보이게) */
    '  col += iridA * (0.55 + 0.7*spot) * uIrid;',
    /* 정반사 방향의 강한 무지개 */
    '  col += iridS * (0.03 + 2.4*pow(align, 24.0)) * lit * uIrid;',
    '',
    /* 판 경계: 어두운 이음매 + 경계 두께가 달라 생기는 대비 프린지 */
    '  float seam = smoothstep(0.0, 0.10, edge);',
    '  col *= mix(0.5, 1.0, seam);',
    '  float fringe = smoothstep(0.10, 0.03, edge)*smoothstep(0.005, 0.03, edge);',
    '  col += iridescence(d*0.62, cosNH, uLayers) * fringe * (0.08 + 1.2*pow(align, 8.0)) * lit * uIrid;',
    '',
    /* 자개 특유의 글린트: 일부 판만 정반사각에서 번쩍임 */
    '  float spk = hash12(id + 7.31);',
    '  float tw = 0.7 + 0.3*sin(uTime*(1.0 + 2.5*spk) + spk*40.0);',
    '  float glint = step(0.78, spk) * pow(align, 48.0) * tw * mix(0.03, 1.0, spot);',
    '  col += iridS * glint * 5.0 * uIrid + vec3(1.0)*glint*glint*1.2;',
    '',
    /* 옻칠 클리어코트의 하이라이트 — 광원 근처의 타이트한 광택만 */
    '  vec3 Ncoat = normalize(vec3(-grad*0.15, 1.0));',
    '  col += vec3(0.9,0.95,1.0)*pow(clamp(dot(reflect(-L,Ncoat),V),0.0,1.0),240.0)*0.12*mix(0.1,1.0,spot);',
    '',
    '  col = 1.0 - exp(-col*uExposure);',   // 톤매핑
    '  col = pow(col, vec3(1.0/2.2));',     // 감마
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // 스타일 2: 염색 자개 시트 — 판상조각(보로노이)마다 제각기 다른 방향의 결
  var FRAG_SHEET = [
    /* 결 함수: 조각별 방향(ang)으로 회전 후 가로축만 노이즈로 굽힌다(나뭇결 방식).
       ph는 조각별 위상 오프셋 — 결이 조각 경계를 넘어 이어지지 않게 한다.
       공간마다 연속적으로 회전하면 전단 때문에 마블링이 되므로 금지. */
    'float grain(vec2 q, vec2 sc, float ang, float ph){',
    '  vec2 r = rot(q, ang);',
    '  r.y += (fbm(q*0.13 + vec2(7.3 + ph, 2.9)) - 0.5)*1.2;',   // 조각 안 결의 굽이
    '  r.x += (fbm(q*0.11 + vec2(41.0, 13.0 + ph)) - 0.5)*0.8;',
    /* 3옥타브 — 마지막 옥타브가 가는 평행 줄무늬(자글자글함)를 만든다.
       방향이 조각 안에서 고정이라 마블링으로 뭉개지지 않는다. */
    '  return 0.52*vnoise(r*sc + ph) + 0.30*vnoise(r*sc*2.3 + vec2(9.7 + ph, 3.1))',
    '       + 0.18*vnoise(r*sc*5.1 + vec2(4.3, 8.9 + ph));',
    '}',
    '',
    'void main(){',
    '  vec2 p = (gl_FragCoord.xy - 0.5*uRes)/min(uRes.x, uRes.y);',
    '  vec2 q = p*uScale + vec2(uSeed*13.7, uSeed*7.9);',
    '',
    /* 판상조각 도메인: 원래 자개처럼 보로노이 — 단, 조각을 크게 잡아 덜 자글자글하게 */
    '  vec2 id; float f1; float f2;',
    '  voronoi(q*0.55/uPiece, id, f1, f2);',
    '  float edge = f2 - f1;',
    '',
    /* 조각마다 다른 결 방향·위상 (실물 상감처럼 결이 조각 경계에서 끊긴다) */
    '  float ang = uFlow + (hash12(id + 2.2) - 0.5)*uFlowVar*2.0;',
    '  float ph = hash12(id)*23.0;',
    '',
    /* 이방성 결: 결 방향으로 길고 가로로 촘촘 */
    '  vec2 sc = vec2(0.22, 0.85)*uStreak;',
    '  float streak = grain(q, sc, ang, ph);',
    '',
    /* 결의 기울기 → 법선 (조각 파라미터는 고정한 채 미분) */
    '  float e = 0.05;',
    '  vec2 sg = vec2(grain(q + vec2(e, 0.0), sc, ang, ph) - streak,',
    '                 grain(q + vec2(0.0, e), sc, ang, ph) - streak)/e;',
    '  vec2 tiltP = (hash22(id + 3.3) - 0.5)*0.14;',   // 조각별 미세 기울기
    '  vec3 Nrm = normalize(vec3(-sg*0.38 - tiltP, 1.0));',
    '',
    '  vec3 V = normalize(vec3(-p*0.3, 1.0));',
    '  vec3 L = normalize(vec3(uPointer*1.1, 0.9));',
    '  vec3 H = normalize(V+L);',
    '',
    '  float cosNH = clamp(dot(Nrm,H), 0.0, 1.0);',
    '  float cosNV = clamp(dot(Nrm,V), 0.0, 1.0);',
    '  float align = clamp(dot(reflect(-L,Nrm), V), 0.0, 1.0);',
    '',
    /* 두께장: 결을 따라 흐르는 변화 + 큰 성장 무늬 */
    '  float d = uThick * (1.0 + 0.18*(streak*2.0 - 1.0)',
    '                          + 0.10*(fbm(q*0.2 + vec2(31.7))*2.0 - 1.0));',
    '',
    /* 염색된 밝은 바탕: 결의 명암 (contrast로 진폭 조절) + 조각별 톤·색 편차 */
    '  float bright = 0.94 + 0.28*(hash12(id + 5.5) - 0.5);',
    '  vec3 jit = 1.0 + 0.08*(hash22(id + 6.4).xyx - 0.5)*vec3(1.0, 0.6, 1.0);',
    '  vec3 col = uTint * jit * bright * max(1.0 + (streak*2.0 - 1.0)*0.62*uContrast, 0.05);',
    '',
    /* 파스텔 간섭색: 층수가 적어 피크가 넓다 → 채도 낮은 분홍/라벤더 */
    /* 바탕색이 지배하고, 플래시는 마스크가 걸린 일부 영역에만 */
    '  vec3 iridA = iridescence(d, cosNV, uLayers);',
    '  vec3 iridS = iridescence(d, cosNH, uLayers);',
    '  float mask = smoothstep(0.62, 0.9, fbm(q*0.4 + vec2(17.0, 5.0)));',
    '  col += iridA * 0.05 * uIrid;',
    '  col += iridS * (0.06 + 1.0*pow(align, 8.0)) * mix(0.15, 1.0, mask) * uIrid;',
    '',
    /* 진주광택의 흰 광: 넓은 시엔 + 결 능선의 또렷한 광 */
    '  col += vec3(1.0, 0.99, 0.97) * uSheen * (0.06*pow(align, 4.0)',
    '       + 0.50*pow(align, 24.0)*(0.5 + 0.5*streak));',
    '',
    /* 자개 글린트: 일부 조각만 정반사각에서 반짝 */
    '  float spk = hash12(id + 7.31);',
    '  float tw = 0.8 + 0.2*sin(uTime*(1.2 + 2.0*spk) + spk*40.0);',
    '  float glint = step(0.78, spk) * pow(align, 60.0) * tw;',
    '  col += (vec3(0.9) + iridS*0.8) * glint * uSheen;',
    '',
    /* 조각 이음매: 거의 안 보일 만큼 가는 선 — 조각 구분은 결 방향·톤 차이가 담당 */
    '  col *= mix(0.92, 1.0, smoothstep(0.0, 0.012, edge));',
    '',
    '  col = 1.0 - exp(-col*uExposure);',   // 톤매핑
    '  col = pow(col, vec3(1.0/2.2));',     // 감마
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* ---------------- 스타일 프리셋 ---------------- */

  var PRESETS = {
    lacquer: {
      tint: [0.008, 0.010, 0.017],  // 옻칠 흑색(선형) — 살짝 차가운 톤
      layers: 8, thickness: 380, exposure: 1.35, scale: 11, variance: 0.25,
      iridescence: 2.5
      // 두께 380nm·층수 8 → 진한 파랑, variance 0.25 → 판 두께 균일해 일관된 강한 파랑
    },
    sheet: {
      tint: [0.6661169687758508, 0.7742273142184416, 0.9913928435929399], // #d4e3fe
      layers: 8, thickness: 395, exposure: 1.7, scale: 4.5,
      iridescence: 2.5, // 구조색 세기
      flow: 12,       // 결 기준 방향(도)
      flowVar: 35,    // 조각별 결 방향 편차(도)
      streak: 1.2,    // 결 밀도
      sheen: 1.1,     // 흰 광 세기
      contrast: 1.2,  // 결 명암 대비
      piece: 2.1      // 조각 평균 크기 배율
    }
  };

  /* ---------------- WebGL 인스턴스 ---------------- */

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error('Nacre shader: ' + gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  function attach(target, opts) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;
    var style = (opts && opts.style) || 'lacquer';
    var preset = PRESETS[style] || PRESETS.lacquer;
    var o = Object.assign({
      scale: 7.0,        // 판/타일 밀도
      thickness: 470,    // 아라고나이트 판 두께(nm) — 색조를 결정
      layers: 6,         // 유효 간섭 층수 — 채도를 결정
      iridescence: 1.0,  // 구조색 세기
      exposure: 1.35,    // 톤매핑 노출
      seed: (el.id ? el.id.length * 0.73 : 0) + 1.37,
      speed: 1.0,
      maxDpr: 1.75,
      flow: -40, flowVar: 35, streak: 1.0, sheen: 1.0, contrast: 1.0, piece: 1.0, variance: 1.0
    }, preset, opts || {});
    o.style = style;
    o.tint = normTint(o.tint) || preset.tint;
    o.layers = Math.max(2, Math.round(o.layers)); // 층수가 정수가 아니면 간섭식이 발산

    var canvas;
    if (el.tagName === 'CANVAS') {
      canvas = el;
    } else {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0'; canvas.style.left = '0';
      canvas.style.width = '100%'; canvas.style.height = '100%';
      canvas.style.display = 'block';
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.insertBefore(canvas, el.firstChild);
    }

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false })
          || canvas.getContext('experimental-webgl');
    if (!gl) {
      if (canvas !== el && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      el.classList.add('nacre-fallback');
      return null;
    }

    var frag = FRAG_COMMON + '\n' + (style === 'sheet' ? FRAG_SHEET : FRAG_LACQUER);
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Nacre link: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes', 'uTime', 'uPointer', 'uScale', 'uThick', 'uLayers', 'uIrid', 'uSeed', 'uExposure', 'uTint',
     'uFlow', 'uFlowVar', 'uStreak', 'uSheen', 'uContrast', 'uPiece', 'uVar']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    bindPointer();

    var running = true, visible = true, raf = 0, t0 = performance.now();

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, o.maxDpr);
      var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function frame(now) {
      raf = 0;
      if (!running || !visible) return;
      resize();
      var t = (now - t0) / 1000 * o.speed;
      // 포인터를 부드럽게 따라가고, 유휴 시엔 광원이 아주 천천히 배회
      var drift = reducedMotion ? 0 : 0.12;
      var tx = pointer.tx + drift * Math.sin(t * 0.23);
      var ty = pointer.ty + drift * Math.cos(t * 0.17);
      pointer.x += (tx - pointer.x) * 0.055;
      pointer.y += (ty - pointer.y) * 0.055;

      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, reducedMotion ? 0 : t);
      gl.uniform2f(U.uPointer, pointer.x, pointer.y);
      gl.uniform1f(U.uScale, o.scale);
      gl.uniform1f(U.uThick, o.thickness);
      gl.uniform1f(U.uLayers, o.layers);
      gl.uniform1f(U.uIrid, o.iridescence);
      gl.uniform1f(U.uSeed, o.seed);
      gl.uniform1f(U.uExposure, o.exposure);
      gl.uniform3f(U.uTint, o.tint[0], o.tint[1], o.tint[2]);
      gl.uniform1f(U.uFlow, o.flow * Math.PI / 180);
      gl.uniform1f(U.uFlowVar, o.flowVar * Math.PI / 180);
      gl.uniform1f(U.uStreak, o.streak);
      gl.uniform1f(U.uSheen, o.sheen);
      gl.uniform1f(U.uContrast, o.contrast);
      gl.uniform1f(U.uPiece, Math.max(o.piece, 0.05));
      gl.uniform1f(U.uVar, o.variance);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && running && visible) raf = requestAnimationFrame(frame); }

    var io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        kick();
      });
      io.observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) kick();
    });
    window.addEventListener('resize', kick);
    kick();

    return {
      canvas: canvas,
      options: o,
      setOptions: function (patch) {
        Object.assign(o, patch);
        if (patch && patch.layers != null) o.layers = Math.max(2, Math.round(o.layers));
        if (patch && patch.tint != null) o.tint = normTint(patch.tint) || o.tint;
        kick();
      },
      pause: function () { running = false; },
      resume: function () { running = true; kick(); },
      destroy: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        if (io) io.disconnect();
        if (canvas !== el && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  /* ---------------- 텍스트 하이라이트 (GL 없이 같은 물리로 그라디언트 생성) ---------------- */

  var textInstances = [];
  var textRaf = 0;
  var textT0 = typeof performance !== 'undefined' ? performance.now() : 0;

  function textFrame(now) {
    textRaf = 0;
    if (!textInstances.length) return;
    var t = reducedMotion ? 0 : (now - textT0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.08;
    pointer.y += (pointer.ty - pointer.y) * 0.08;

    for (var k = 0; k < textInstances.length; k++) {
      var inst = textInstances[k];
      var o = inst.o, seed = inst.seed;
      var stops = [];
      for (var i = 0; i <= o.stops; i++) {
        // 그라디언트 위치마다 두께·각도를 다르게 → 실물처럼 색이 훑고 지나감
        var d = o.thickness * (1
          + 0.16 * Math.sin(seed * 6.28 + i * 1.7 + t * 0.25)
          + 0.07 * Math.sin(i * 3.3 - t * 0.11));
        var cos = 0.55 + 0.38 * Math.sin(i * 0.85 + seed * 9
          + pointer.x * 2.4 + pointer.y * 1.2 + t * 0.07);
        cos = Math.max(0.12, Math.min(0.98, cos));
        var rgb;
        if (inst.tint) {
          // 시트 스타일: 염색 바탕 위에 파스텔 간섭색과 흰 광을 얹는다
          var band = 0.75 + 0.45 * Math.sin(seed * 7 + i * 1.35 + t * 0.2);
          var ir = iridescence(d, cos, o.layers);
          var sheen = 0.14 * Math.pow(Math.max(0,
            Math.sin(i * 0.9 + pointer.x * 2.5 + seed * 5 + t * 0.1)), 8);
          rgb = tonemap([
            inst.tint[0] * band + ir[0] * 0.22 + sheen,
            inst.tint[1] * band + ir[1] * 0.22 + sheen,
            inst.tint[2] * band + ir[2] * 0.22 + sheen
          ], o.exposure);
        } else {
          rgb = tonemap(iridescence(d, cos, o.layers), o.exposure);
        }
        // 가독성: 최소 밝기 보정(진주 광택의 흰 기운)
        var luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        if (luma < o.minLuma) {
          var add = o.minLuma - luma;
          rgb[0] += add; rgb[1] += add; rgb[2] += add;
        }
        stops.push('rgb(' + Math.round(Math.min(rgb[0], 1) * 255) + ','
                          + Math.round(Math.min(rgb[1], 1) * 255) + ','
                          + Math.round(Math.min(rgb[2], 1) * 255) + ') '
                          + Math.round(i / o.stops * 100) + '%');
      }
      inst.el.style.backgroundImage =
        'linear-gradient(' + o.angle + 'deg, ' + stops.join(', ') + ')';
    }
    textRaf = requestAnimationFrame(textFrame);
  }

  function text(target, opts) {
    var els;
    if (typeof target === 'string') els = Array.prototype.slice.call(document.querySelectorAll(target));
    else if (target instanceof Element) els = [target];
    else els = Array.prototype.slice.call(target);
    if (!els.length) return null;

    var tint = normTint(opts && opts.tint);
    var o = Object.assign({
      thickness: 470,
      layers: tint ? 3 : 6,   // 염색 바탕이면 파스텔 톤
      stops: 10,
      angle: 105,
      exposure: tint ? 2.1 : 3.0,
      minLuma: 0.30
    }, opts || {});
    o.layers = Math.max(2, Math.round(o.layers));

    bindPointer();
    var made = els.map(function (el, idx) {
      el.style.webkitBackgroundClip = 'text';
      el.style.backgroundClip = 'text';
      el.style.color = 'transparent';
      var inst = { el: el, o: o, tint: tint, seed: (idx + 1) * 0.317 % 1 };
      textInstances.push(inst);
      return inst;
    });
    if (!textRaf) textRaf = requestAnimationFrame(textFrame);

    return {
      setOptions: function (patch) {
        Object.assign(o, patch);
        if (patch && patch.layers != null) o.layers = Math.max(2, Math.round(o.layers));
        if (patch && patch.tint !== undefined) {
          var nt = normTint(patch.tint);
          made.forEach(function (inst) { inst.tint = nt; });
        }
      },
      destroy: function () {
        made.forEach(function (inst) {
          var i = textInstances.indexOf(inst);
          if (i >= 0) textInstances.splice(i, 1);
          inst.el.style.backgroundImage = '';
          inst.el.style.color = '';
        });
      }
    };
  }

  /* ---------------- data-속성 자동 초기화 ---------------- */

  function pick(ds, keys) { // dataset에 실제로 지정된 값만 옵션으로 전달
    var o = {};
    keys.forEach(function (k) {
      if (ds[k] != null && ds[k] !== '') o[k] = parseFloat(ds[k]);
    });
    return o;
  }
  function auto() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-nacre]'), function (el) {
      var o = pick(el.dataset, ['scale', 'thickness', 'layers', 'iridescence', 'seed', 'exposure',
        'flow', 'flowVar', 'streak', 'sheen', 'contrast', 'piece', 'variance']);
      if (el.dataset.style) o.style = el.dataset.style;
      if (el.dataset.tint) o.tint = el.dataset.tint;
      attach(el, o);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-nacre-text]'), function (el) {
      var o = pick(el.dataset, ['thickness', 'layers', 'stops', 'angle', 'exposure']);
      if (el.dataset.tint) o.tint = el.dataset.tint;
      text(el, o);
    });
  }

  root.Nacre = {
    attach: attach,
    text: text,
    color: color,
    iridescence: iridescence,
    auto: auto
  };
})(typeof window !== 'undefined' ? window : globalThis);
