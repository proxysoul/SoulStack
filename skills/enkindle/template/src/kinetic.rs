use crate::draw::*;
use crate::theme::World;
use crate::util::*;
use crate::lay::*;
use crate::song::*;
use fframes::media::ImageData;
use fframes::{Svgr, Transform};

const GLYPHS: &[u8] = b"#%&@$0123456789ABCDEFGHJKLMNPQRSTUVWXYZ<>/*+=?";

pub fn slam(word: &str, x: f32, y: f32, size: f32, font: &'static str, fill: String, w: &World, age: f32, rot: f32) -> Svgr<'static> {
    if age < 0.0 {
        return Svgr::empty();
    }
    let e = spring(age * 1.15).min(1.25);
    let sc = lerp(2.6, 1.0, e.min(1.0)) + (e - 1.0).max(0.0) * 0.4;
    let r = rot * (1.0 - clamp01(age / 0.3));
    let op = clamp01(age / 0.04);
    let split = (1.0 - clamp01(age / 0.35)) * 22.0 + 3.0;
    let weight = if font == BODY { "500" } else { "700" };
    let ghost = |dx: f32, dy: f32, col: &str, o: f32| -> Svgr<'static> {
        fframes::svgr!(<text x={dx} y={dy} font-family={font} font-size={size} font-weight={weight} fill={s(col)} text-anchor="middle" opacity={o}>{word.to_string()}</text>)
    };
    let main = fframes::svgr!(<text x="0" y="0" font-family={font} font-size={size} font-weight={weight} fill={fill} text-anchor="middle">{word.to_string()}</text>);
    let parts = vec![ghost(-split, 0.0, w.alt, 0.55), ghost(split, split * 0.3, w.accent, 0.55), main];
    fframes::svgr!(
        <g opacity={op} transform={Transform { translate_x: x as f64, translate_y: y as f64, rotate: r.into(), scale: fframes::Scale::from((sc as f64, sc as f64)), ..Default::default() }}>
            {parts}
        </g>
    )
}

pub fn mono_letters(word: &str, x: f32, y: f32, size: f32, fill: String, age: f32, stagger: f32, seed: f32) -> Svgr<'static> {
    let adv = size * 0.6;
    let n = word.chars().count() as f32;
    let x0 = x - adv * n / 2.0 + adv / 2.0;
    let mut v = Vec::new();
    for (i, ch) in word.chars().enumerate() {
        let a = age - i as f32 * stagger;
        if a < 0.0 {
            continue;
        }
        let e = back_out(a / 0.22);
        let dy = (1.0 - e) * -size * 1.4;
        let rot = (1.0 - clamp01(a / 0.22)) * (hash(i as f32 + seed) - 0.5) * 70.0;
        v.push(fframes::svgr!(
            <g transform={Transform { translate_x: (x0 + i as f32 * adv) as f64, translate_y: (y + dy) as f64, rotate: rot.into(), ..Default::default() }} opacity={clamp01(a / 0.05)}>
                <text x="0" y="0" font-family={MONO} font-size={size} font-weight="700" fill={fill.clone()} text-anchor="middle">{ch.to_string()}</text>
            </g>
        ));
    }
    group(v)
}

pub fn explode(word: &str, x: f32, y: f32, size: f32, fill: String, age: f32, seed: f32) -> Svgr<'static> {
    let adv = size * 0.6;
    let n = word.chars().count() as f32;
    let x0 = x - adv * n / 2.0 + adv / 2.0;
    let e = ease_out(age / 0.6);
    let mut v = Vec::new();
    for (i, ch) in word.chars().enumerate() {
        let ang = (hash(i as f32 * 3.7 + seed) - 0.5) * 2.6 - std::f32::consts::FRAC_PI_2 * (if i % 2 == 0 { 1.0 } else { -0.4 });
        let dist = e * (500.0 + hash(i as f32 + seed) * 700.0);
        let px = x0 + i as f32 * adv + ang.cos() * dist;
        let py = y + ang.sin() * dist + e * e * 300.0;
        let rot = e * (hash(i as f32 * 1.3) - 0.5) * 720.0;
        v.push(fframes::svgr!(
            <g transform={Transform { translate_x: px as f64, translate_y: py as f64, rotate: rot.into(), scale: fframes::Scale::from(((1.0 + e) as f64, (1.0 + e) as f64)), ..Default::default() }} opacity={1.0 - e}>
                <text x="0" y="0" font-family={MONO} font-size={size} font-weight="700" fill={fill.clone()} text-anchor="middle">{ch.to_string()}</text>
            </g>
        ));
    }
    group(v)
}

pub fn decode(word: &str, x: f32, y: f32, size: f32, fill: String, age: f32, dur: f32, tick: f32, anchor: &'static str) -> Svgr<'static> {
    let n = word.chars().count();
    let shown = ((age / dur) * n as f32).floor() as usize;
    let mut out = String::new();
    for (i, ch) in word.chars().enumerate() {
        if i < shown || ch == ' ' || ch == '.' || ch == ',' {
            out.push(ch);
        } else {
            let k = (hash(i as f32 * 7.1 + tick) * GLYPHS.len() as f32) as usize % GLYPHS.len();
            out.push(GLYPHS[k] as char);
        }
    }
    text(x, y, size, MONO, fill, anchor, out, 1.0)
}

pub fn typewriter(body: &str, x: f32, y: f32, size: f32, fill: String, caret: String, age: f32, cps: f32, anchor: &'static str) -> Svgr<'static> {
    if age < 0.0 {
        return Svgr::empty();
    }
    let n = ((age * cps) as usize).min(body.chars().count());
    let shown: String = body.chars().take(n).collect();
    let full = body.chars().count() as f32 * size * 0.6;
    let start = match anchor {
        "middle" => x - full / 2.0,
        "end" => x - full,
        _ => x,
    };
    let cx = start + n as f32 * size * 0.6;
    let blink = if n < body.chars().count() || (age * 2.2).fract() < 0.55 { 1.0 } else { 0.0 };
    group(vec![
        text(start, y, size, MONO, fill, "start", shown, 1.0),
        rect(cx + size * 0.06, y - size * 0.78, size * 0.5, size * 0.92, 2.0, caret, blink),
    ])
}

pub fn sticker(body: &str, x: f32, y: f32, size: f32, rot: f32, w: &World, age: f32, dark: bool) -> Svgr<'static> {
    if age < 0.0 {
        return Svgr::empty();
    }
    let e = spring(age * 1.3).min(1.2);
    let wob = (age * 7.0).sin() * 1.5 * (1.0 - clamp01(age / 1.5));
    let wd = body.chars().count() as f32 * size * 0.56 + size * 0.9;
    let ht = size * 1.45;
    let (bg, fg) = if dark { (s(w.sunken), s(w.accent)) } else { (s(w.accent), s(w.sunken)) };
    let parts = vec![
        rect(-wd / 2.0 + 8.0, -ht / 2.0 + 10.0, wd, ht, 14.0, s("#000000"), 0.45),
        rect(-wd / 2.0, -ht / 2.0, wd, ht, 14.0, bg, 1.0),
        frame(-wd / 2.0, -ht / 2.0, wd, ht, 14.0, s(w.ink), 3.0, if dark { 0.9 } else { 0.0 }),
        text(0.0, size * 0.36, size, HEAD, fg, "middle", body.to_string(), 1.0),
    ];
    place(parts, x, y, lerp(0.2, 1.0, e.min(1.0)) + (e - 1.0).max(0.0) * 0.3, rot + wob, clamp01(age / 0.05))
}

pub fn meme(body: &str, x: f32, y: f32, size: f32, rot: f32, age: f32, shake: f32) -> Svgr<'static> {
    if age < 0.0 {
        return Svgr::empty();
    }
    let jx = (hash(age * 60.0) - 0.5) * shake;
    let jy = (hash(age * 60.0 + 9.0) - 0.5) * shake;
    let e = back_out(age / 0.18);
    fframes::svgr!(
        <g transform={Transform { translate_x: (x + jx) as f64, translate_y: (y + jy) as f64, rotate: rot.into(), scale: fframes::Scale::from((e as f64, e as f64)), ..Default::default() }}>
            <text x="0" y="0" font-family={HEAD} font-size={size} font-weight="700" fill="#ffffff" stroke="#000000" stroke-width={size * 0.09} paint-order="stroke" stroke-linejoin="round" text-anchor="middle">{body.to_string()}</text>
        </g>
    )
}

pub fn streaks(cx: f32, cy: f32, w: &World, amount: f32, t: f32, count: usize) -> Svgr<'static> {
    let mut v = Vec::new();
    for i in 0..count {
        let y = cy + (hash(i as f32 * 1.7) - 0.5) * 700.0;
        let len = 200.0 + hash(i as f32) * 700.0;
        let x = cx + 900.0 - ((t * (2200.0 + hash(i as f32 * 3.0) * 1800.0) + hash(i as f32 * 5.0) * 3000.0) % 3200.0);
        v.push(rect(x, y, len * amount, 3.0 + hash(i as f32 * 9.0) * 5.0, 2.0, if i % 3 == 0 { s(w.spark) } else { s(w.accent) }, 0.5 * amount));
    }
    group(v)
}

pub fn weight(font: &str) -> &'static str {
    if font == BODY {
        "500"
    } else if font == UI {
        "600"
    } else {
        "700"
    }
}

pub fn write_on(body: &str, x: f32, y: f32, size: f32, font: &'static str, fill: String, pen: String, p: f32, anchor: &'static str) -> Svgr<'static> {
    if p <= 0.0 {
        return Svgr::empty();
    }
    let glyphs = body.chars().filter(|c| !c.is_whitespace()).count() as f32;
    let len = glyphs * size * 3.3;
    let drawn = ease_in_out(p / 0.7);
    let fill_op = clamp01((p - 0.45) / 0.35);
    let sw = (size * 0.03).max(2.0);
    let dash = format!("{len:.0} 400000");
    fframes::svgr!(
        <g>
            <text x={x} y={y} font-family={font} font-size={size} font-weight={weight(font)} text-anchor={anchor} fill={fill} opacity={fill_op}>{body.to_string()}</text>
            <text x={x} y={y} font-family={font} font-size={size} font-weight={weight(font)} text-anchor={anchor} fill="none" stroke={pen} stroke-width={sw} stroke-linejoin="round" stroke-linecap="round" stroke-dasharray={dash} stroke-dashoffset={len * (1.0 - drawn)} opacity={1.0 - 0.7 * fill_op}>{body.to_string()}</text>
        </g>
    )
}

pub fn scramble(body: &str, age: f32, dur: f32, seed: f32) -> String {
    let n = body.chars().count();
    let locked = ((age / dur.max(0.01)) * n as f32).floor() as usize;
    let tick = (age * 30.0).floor();
    body.chars()
        .enumerate()
        .map(|(i, ch)| {
            if i < locked || ch == ' ' || ch == '.' || ch == ',' {
                ch
            } else {
                GLYPHS[(hash(i as f32 * 7.1 + tick + seed) * GLYPHS.len() as f32) as usize % GLYPHS.len()] as char
            }
        })
        .collect()
}

pub fn typed(body: &str, age: f32, cps: f32) -> (String, bool) {
    let total = body.chars().count();
    let n = ((age.max(0.0) * cps) as usize).min(total);
    (body.chars().take(n).collect(), n < total)
}

pub fn type_line(body: &str, x: f32, y: f32, size: f32, font: &'static str, fill: String, caret: String, age: f32, cps: f32) -> Svgr<'static> {
    if age < 0.0 {
        return Svgr::empty();
    }
    let (shown, busy) = typed(body, age, cps);
    let adv = if font == MONO { 0.6 } else { 0.52 };
    let cx = x + shown.chars().count() as f32 * size * adv;
    let blink = if busy || (age * 2.4).fract() < 0.5 { 1.0 } else { 0.0 };
    group(vec![
        text(x, y, size, font, fill, "start", shown, 1.0),
        rect(cx + size * 0.08, y - size * 0.8, size * 0.46, size * 0.95, 2.0, caret, blink),
    ])
}

pub fn img_size(img: &ImageData) -> (f32, f32) {
    (img.image.width as f32, img.image.height as f32)
}

pub fn picture(img: &ImageData, cx: f32, cy: f32, width: f32, op: f32) -> Svgr<'static> {
    let (iw, ih) = img_size(img);
    let h = width * ih / iw;
    fframes::svgr!(<image href={img.href()} x={cx - width / 2.0} y={cy - h / 2.0} width={width} height={h} opacity={op} preserveAspectRatio="none" />)
}

pub fn cover(img: &ImageData, focus: (f32, f32), zoom: f32, rot: f32, op: f32) -> Svgr<'static> {
    let (iw, ih) = img_size(img);
    let base = (vw() / iw).max(vh() / ih);
    let (dw, dh) = (iw * base, ih * base);
    let z = zoom.max(1.0);
    let half_w = mx() / z;
    let half_h = my() / z;
    let fx = (focus.0 * dw).clamp(half_w, dw - half_w);
    let fy = (focus.1 * dh).clamp(half_h, dh - half_h);
    fframes::svgr!(
        <g opacity={op} transform={Transform { translate_x: mx() as f64, translate_y: my() as f64, rotate: rot.into(), scale: fframes::Scale::from((z as f64, z as f64)), ..Default::default() }}>
            <g transform={Transform::translate(-fx as f64, -fy as f64)}>
                <image href={img.href()} x="0" y="0" width={dw} height={dh} preserveAspectRatio="none" />
            </g>
        </g>
    )
}

pub fn framed(img: &ImageData, width: f32, w: &World, glow: f32) -> Svgr<'static> {
    let (iw, ih) = img_size(img);
    let h = width * ih / iw;
    let (x, y) = (-width / 2.0, -h / 2.0);
    vec_group(vec![
        rect(x - 18.0, y - 18.0, width + 36.0, h + 36.0, 26.0, s(w.accent), 0.12 + 0.3 * glow),
        rect(x + 22.0, y + 34.0, width, h, 14.0, s("#000000"), 0.55),
        fframes::svgr!(<image href={img.href()} x={x} y={y} width={width} height={h} preserveAspectRatio="none" />),
        frame(x, y, width, h, 12.0, s(w.accent), 3.0 + 4.0 * glow, 0.55 + 0.45 * glow),
    ])
}

pub fn vec_group(v: Vec<Svgr<'static>>) -> Svgr<'static> {
    group(v)
}

fn rounded(x: f32, y: f32, w: f32, h: f32, r: f32) -> String {
    format!(
        "M {:.1} {:.1} H {:.1} A {r:.1} {r:.1} 0 0 1 {:.1} {:.1} V {:.1} A {r:.1} {r:.1} 0 0 1 {:.1} {:.1} H {:.1} A {r:.1} {r:.1} 0 0 1 {:.1} {:.1} V {:.1} A {r:.1} {r:.1} 0 0 1 {:.1} {:.1} Z",
        x + r, y, x + w - r, x + w, y + r, y + h - r, x + w - r, y + h, x + r, x, y + h - r, y + r, x + r, y
    )
}

pub fn device(img: &ImageData, id: &str, width: f32, radius: f32, bezel: f32, w: &World, glow: f32) -> Svgr<'static> {
    let (iw, ih) = img_size(img);
    let h = width * ih / iw;
    let (x, y) = (-width / 2.0, -h / 2.0);
    let (ox, oy, ow, oh) = (x - bezel, y - bezel, width + bezel * 2.0, h + bezel * 2.0);
    let inner = rounded(x, y, width, h, radius);
    let outer = rounded(ox, oy, ow, oh, radius + bezel);
    let ring_d = format!("{outer} {inner}");
    let clip = format!("url(#{id})");
    vec_group(vec![
        fframes::svgr!(<path d={rounded(ox - 14.0, oy - 14.0, ow + 28.0, oh + 28.0, radius + bezel + 14.0)} fill={s(w.accent)} opacity={0.1 + 0.3 * glow} />),
        fframes::svgr!(<path d={rounded(ox + 20.0, oy + 30.0, ow, oh, radius + bezel)} fill="#000000" opacity="0.55" />),
        fframes::svgr!(<path d={ring_d} fill="#08090a" fill-rule="evenodd" />),
        fframes::svgr!(<g><clipPath id={id.to_string()}><path d={inner} /></clipPath><image href={img.href()} x={x} y={y} width={width} height={h} preserveAspectRatio="none" clip-path={clip} /></g>),
        fframes::svgr!(<path d={outer} fill="none" stroke={s(w.ink)} stroke-width="3" opacity="0.55" />),
    ])
}

pub fn letterbox(amount: f32) -> Svgr<'static> {
    if amount <= 0.0 {
        return Svgr::empty();
    }
    group(vec![rect(0.0, 0.0, vw(), 120.0 * amount, 0.0, s("#000000"), 1.0), rect(0.0, vh() - 120.0 * amount, vw(), 120.0 * amount, 0.0, s("#000000"), 1.0)])
}

pub fn burst(cx: f32, cy: f32, t: f32, age: f32, w: &World, count: usize, reach: f32) -> Svgr<'static> {
    let kick = pulse(KICKS, t, 0.2);
    let grow = ease_out(age / 0.6);
    let mut v = Vec::new();
    for i in 0..count {
        let fi = i as f32;
        let ang = fi / count as f32 * std::f32::consts::TAU + hash(fi * 3.3) * 0.25;
        let len = reach * (0.45 + 0.55 * hash(fi * 1.7)) * grow * (1.0 + 0.25 * kick);
        let (c, sn) = (ang.cos(), ang.sin());
        v.push(line(cx, cy, cx + c * len, cy + sn * len, if i % 3 == 0 { s(w.spark) } else { s(w.accent) }, 2.0 + 2.0 * hash(fi), 0.55));
        let flow = (t * (0.8 + hash(fi * 2.1)) + hash(fi)) % 1.0;
        v.push(dot(cx + c * len * flow, cy + sn * len * flow, 4.0 + 3.0 * kick, s(w.spark), 0.9 * (1.0 - flow)));
        v.push(dot(cx + c * len, cy + sn * len, 7.0, s(w.accent), 0.9 * grow));
    }
    v.push(dot(cx, cy, 26.0 + 14.0 * kick, s(w.spark), 0.9));
    v.push(ring(cx, cy, 46.0 + 30.0 * kick, s(w.accent), 4.0, 0.8));
    group(v)
}

pub fn callout(body: &str, x: f32, y: f32, ax: f32, ay: f32, age: f32, w: &World) -> Svgr<'static> {
    if age < 0.0 {
        return Svgr::empty();
    }
    let (shown, _) = typed(body, age - 0.08, 60.0);
    let wd = 44.0 + body.chars().count() as f32 * 21.0;
    let e = back_out(age / 0.2);
    let link = ease_out(age / 0.25);
    vec_group(vec![
        line(x, y, lerp(x, ax, link), lerp(y, ay, link), s(w.accent), 4.0, 1.0),
        dot(ax, ay, 12.0 * link, s(w.spark), 1.0),
        ring(ax, ay, 20.0 + 30.0 * (1.0 - link), s(w.spark), 3.0, link),
        place(
            vec![
                rect(-wd / 2.0 + 6.0, -36.0 + 8.0, wd, 64.0, 32.0, s("#000000"), 0.5),
                rect(-wd / 2.0, -36.0, wd, 64.0, 32.0, s(w.accent), 1.0),
                text(-wd / 2.0 + 22.0, 8.0, 36.0, MONO, s(w.sunken), "start", shown, 1.0),
            ],
            x,
            y,
            e,
            0.0,
            1.0,
        ),
    ])
}

pub fn bullet(label: &str, sub: &str, age: f32, life: f32, y: f32, w: &World, seed: f32) -> Svgr<'static> {
    if age < 0.0 || age > life {
        return Svgr::empty();
    }
    let u = age / life;
    let x = lerp(vw() + 330.0, -500.0, u.powf(0.85));
    let rot = (hash(seed) - 0.5) * 10.0;
    let wd = 40.0 + label.chars().count() as f32 * 22.0;
    let mut v = Vec::new();
    for k in 1..5 {
        let kk = k as f32;
        v.push(rect(wd * 0.5 + kk * 46.0, -26.0 + kk * 4.0, 120.0 - kk * 18.0, 52.0 - kk * 8.0, 10.0, s(w.accent), 0.3 / kk));
    }
    v.push(rect(-wd / 2.0, -32.0, wd, 64.0, 14.0, s(w.sunken), 0.96));
    v.push(frame(-wd / 2.0, -32.0, wd, 64.0, 14.0, s(w.accent), 3.0, 1.0));
    v.push(text(0.0, 12.0, 36.0, MONO, s(w.accent), "middle", label.to_string(), 1.0));
    if !sub.is_empty() {
        v.push(text(-wd / 2.0 + 6.0, 62.0, 20.0, MONO, s(w.ink), "start", sub.to_string(), 0.85));
    }
    place(v, x, y, 1.0, rot, clamp01(age / 0.03))
}
