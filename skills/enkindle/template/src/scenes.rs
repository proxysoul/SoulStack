use crate::content::*;
use crate::dev::Pose;
use crate::draw::*;
use crate::kinetic::*;
use crate::lay::*;
use crate::song::*;
use crate::theme::*;
use crate::timeline::*;
use crate::util::*;
use fframes::{FFramesContext, Svgr, Transform};

pub fn dev_x() -> f32 {
    mx()
}

pub fn dev_y(t: f32) -> f32 {
    match act_at(t) {
        Act::Intro => pick(690.0, 1240.0),
        Act::Build => pick(760.0, 1300.0),
        Act::Outro => pick(900.0, 1330.0),
        _ => pick(660.0, 1200.0),
    }
}

pub fn dev_scale(t: f32) -> f32 {
    match act_at(t) {
        Act::Intro => pick(0.86, 1.0),
        Act::Build => pick(0.62, 0.8),
        Act::Outro => pick(0.5, 0.6),
        _ => pick(0.9, 1.02),
    }
}

pub fn logo_pos(t: f32) -> (f32, f32) {
    (dev_x(), dev_y(t) + 212.0 * dev_scale(t))
}

pub fn face_pos(t: f32) -> (f32, f32) {
    (dev_x(), dev_y(t) - 175.0 * dev_scale(t))
}

pub fn laugh_pulse(t: f32) -> f32 {
    pulse(&LAUGH, t, 0.12)
}

pub fn pose(t: f32, kick: f32) -> Pose {
    let smirk = match act_at(t) {
        Act::Intro => clamp01((t - W_AMIGO) / 0.25) * (1.0 - clamp01((t - 5.3) / 0.4)) + 0.15,
        Act::Build => 0.2 + 0.3 * clamp01((t - 16.5) / 1.0),
        Act::Break | Act::Gap => 1.0,
        _ => 0.75,
    };
    let mut glint: f32 = hit(t, W_AMIGO + 0.08, 0.45).max(hit(t, T_DROP1, 0.4)).max(hit(t, T_DROP2, 0.4)).max(hit(t, T_END - 1.2, 0.5));
    for at in STABS {
        glint = glint.max(hit(t, at, 0.3));
    }
    if act_at(t) == Act::Drop {
        if let Some((_, d)) = last_before(DOWNBEATS, t) {
            glint = glint.max(hit(t, d, 0.25) * 0.8);
        }
    }
    let sweat = window(t, VOICE_2[0], VOICE_2[8] + 0.6, 0.15, 0.4);
    let wink = window(t, T_END - 0.6, T_END - 0.25, 0.06, 0.08);
    let laugh = if (LAUGH[0] - 0.05..T_DROP2 + 0.5).contains(&t) { 0.55 + 0.45 * laugh_pulse(t) } else { 0.0 };
    let glow = clamp01((t - 16.0) / 2.8) * if t < T_DROP1 { 1.0 } else { 0.0 };
    let fire = match act_at(t) {
        Act::Drop | Act::Break => 1.0,
        Act::Build => clamp01((t - 16.3) / 2.5) * 0.85,
        _ => 0.0,
    };
    Pose { t, kick, smirk, glint, sweat, wink, glow, fire, laugh }
}

pub fn sparks(t: f32, w: &World) -> Svgr<'static> {
    let (ox, oy) = (dev_x(), dev_y(t) - 15.0);
    let spread = 520.0 * dev_scale(t) / 0.9;
    let mut v = Vec::new();
    let from = HITS.partition_point(|&k| k < t - 0.55);
    let to = HITS.partition_point(|&k| k <= t);
    for (n, at) in HITS[from..to].iter().enumerate() {
        let age = t - at;
        for i in 0..10 {
            let sd = at * 31.0 + i as f32 * 7.3 + n as f32;
            let ang = -std::f32::consts::FRAC_PI_2 + (hash(sd) - 0.5) * 2.4;
            let sp = 500.0 + hash(sd + 1.0) * 900.0;
            let x = ox + (hash(sd + 2.0) - 0.5) * spread + ang.cos() * sp * age;
            let y = oy + ang.sin() * sp * age + 900.0 * age * age;
            let r = (2.0 + hash(sd + 3.0) * 4.5) * (1.0 - age / 0.55);
            v.push(dot(x, y, r, if i % 3 == 0 { s(w.spark) } else { s(w.accent) }, 1.0 - age / 0.55));
        }
    }
    group(v)
}

pub fn intro(t: f32, w: &World, front: &mut Vec<Svgr<'static>>, screen: &mut Vec<Svgr<'static>>) {
    let times = LYRICS.map(|(a, _)| a);
    let Some((i, at)) = last_before(&times, t) else {
        let a = t - KICKS[0];
        front.push(mono_letters(PRODUCT, mx(), my() - pick(240.0, 420.0), pick(120.0, 110.0), s(w.accent), a, 0.09, 3.0));
        return;
    };
    let age = t - at;
    let (word, punch) = (LYRICS[i].1, i >= 8);
    if punch {
        if i > 8 {
            front.push(explode(LYRICS[i - 1].1, mx(), my() - pick(140.0, 360.0), pick(300.0, 220.0), s(w.ink), age, i as f32));
        }
        front.push(slam(word, mx(), my() - pick(120.0, 340.0), pick(420.0, 300.0), HEAD, s(w.ink), w, age, if i % 2 == 0 { -8.0 } else { 9.0 }));
    } else {
        front.push(slam(word, mx(), my() - pick(170.0, 420.0), fit(word, pick(1500.0, 960.0), pick(260.0, 210.0), 0.55), HEAD, s(w.ink), w, age, if i % 2 == 0 { -6.0 } else { 6.0 }));
    }
    let said: Vec<&str> = LYRICS.iter().take(i.min(7) + 1).map(|(_, w)| *w).collect();
    let line = said.join(" ");
    let op = 1.0 - ease_in((t - (W_PUNCH - 0.1)) / 0.15);
    if op > 0.0 {
        let size = pick(64.0, 50.0);
        for (k, part) in wrap(&line, pick(48, 24)).iter().enumerate() {
            screen.push(place(vec![meme(part, 0.0, 0.0, size, 0.0, 1.0, 0.0)], mx(), vh() - pick(150.0, 360.0) + k as f32 * size * 1.1, 1.0, 0.0, op));
        }
    }
}

pub fn chapter_at(t: f32) -> Option<(usize, &'static Chapter)> {
    CHAPTERS.iter().enumerate().filter(|(_, c)| t >= c.at).last()
}

pub fn build(t: f32, w: &World, ctx: &FFramesContext, front: &mut Vec<Svgr<'static>>, screen: &mut Vec<Svgr<'static>>) {
    if let Some((ci, ch)) = chapter_at(t) {
        let age = t - ch.at;
        let fade = 1.0 - ease_in((t - (CALLS[0] - 0.25)) / 0.25);
        if fade > 0.0 {
            if let Some(img) = ctx.get_image(ch.img) {
                let enter = ease_out(age / 0.35);
                let (x, y, width) = pick((1230.0, 430.0, 1050.0), (540.0, 640.0, 920.0));
                let dx = lerp(pick(1500.0, 1100.0), 0.0, enter) + (age * 0.9).sin() * 12.0;
                let rot = lerp(if ci % 2 == 0 { 22.0 } else { -22.0 }, -2.5 + (age * 0.7).sin() * 1.5, enter);
                let id = format!("chapterClip{ci}");
                front.push(place(vec![device(img, &id, width, 22.0, 14.0, w, hit(t, ch.at, 0.5))], x + dx, y, lerp(1.25, 1.0, enter), rot, fade));
            }
            let (tx, ty, size) = pick((110.0, 330.0, 280.0), (70.0, 230.0, 220.0));
            screen.push(write_on(ch.tag, tx, ty, size, HEAD, s(w.ink), s(w.accent), (age - 0.02) / 0.55, "start"));
            screen.push(type_line(ch.title, tx + 8.0, ty + pick(90.0, 80.0), pick(56.0, 48.0), MONO, s(w.accent), s(w.ink), age - 0.3, 30.0));
            screen.push(typewriter(ch.line, tx + 8.0, ty + pick(150.0, 135.0), pick(32.0, 30.0), s(w.soft), s(w.soft), age - 0.75, 40.0, "start"));
        }
    }
    let roll_len = CALLS[0] - T_ROLL;
    let lanes = pick([vh() - 150.0, vh() - 80.0], [vh() - 260.0, vh() - 180.0]);
    for (i, m) in MILESTONES.iter().enumerate() {
        let at = T_ROLL + i as f32 * roll_len / MILESTONES.len() as f32;
        front.push(bullet(m, "", t - at, 0.62, lanes[i % 2], w, i as f32));
    }
    let la = t - (T_CHAPTER3 + 1.1);
    if (0.0..CALLS[0] - T_CHAPTER3 - 1.1).contains(&la) {
        let len = CALLS[0] - T_CHAPTER3 - 1.25;
        let p = clamp01(la / len);
        let bw = 470.0;
        front.push(place(
            vec![
                rect(-bw / 2.0 - 26.0, -66.0, bw + 52.0, 130.0, 20.0, s(w.sunken), 0.94),
                frame(-bw / 2.0 - 26.0, -66.0, bw + 52.0, 130.0, 20.0, s(w.accent), 3.0, 1.0),
                type_line("booting v3", -bw / 2.0, -14.0, 32.0, MONO, s(w.ink), s(w.accent), la, 26.0),
                text(bw / 2.0, -14.0, 32.0, MONO, s(w.accent), "end", format!("{}%", (p * 99.0) as u32), 1.0),
                rect(-bw / 2.0, 14.0, bw, 20.0, 10.0, s(w.rule), 1.0),
                rect(-bw / 2.0, 14.0, bw * p, 20.0, 10.0, s(w.accent), 1.0),
            ],
            pick(1490.0, 540.0),
            pick(770.0, 990.0),
            back_out(la / 0.2),
            3.0,
            1.0 - ease_in((la - len) / 0.15),
        ));
    }
    for (i, at) in CALLS.iter().enumerate() {
        let next = CALLS.get(i + 1).copied().unwrap_or(T_DROP1);
        if t >= *at && t < next {
            screen.push(slam(CALL_WORD, mx(), my() + pick(60.0, 0.0), pick(300.0, 200.0) * (1.0 + 0.18 * i as f32), HEAD, s(w.ink), w, t - at, [-7.0, 6.0, -9.0][i]));
        }
    }
}

pub fn card(f: &Feature, w: &World, age: f32, glow: f32) -> Svgr<'static> {
    let (cw, ch) = (440.0, 300.0);
    let (x, y) = (-cw / 2.0, -ch / 2.0);
    let fill = ease_out((age - 0.15) / 0.7);
    vec_group(vec![
        rect(x + 14.0, y + 20.0, cw, ch, 24.0, s("#000000"), 0.5),
        rect(x, y, cw, ch, 24.0, s(w.sunken), 0.97),
        rect(x, y, cw, ch, 24.0, s(w.accent), 0.06 + 0.25 * glow),
        frame(x, y, cw, ch, 24.0, s(w.accent), 3.0 + 4.0 * glow, 1.0),
        text(x + 30.0, y + 96.0, 76.0, MONO, s(w.accent), "start", f.glyph.to_string(), 1.0),
        text(x + 30.0, y + 180.0, 38.0, HEAD, s(w.ink), "start", clip(f.title, 21), 1.0),
        text(x + 30.0, y + 222.0, 24.0, MONO, s(w.soft), "start", clip(f.line, 29), 1.0),
        rect(x + 30.0, y + 250.0, cw - 60.0, 10.0, 5.0, s(w.rule), 1.0),
        rect(x + 30.0, y + 250.0, (cw - 60.0) * fill, 10.0, 5.0, s(w.accent), 1.0),
    ])
}

const SLOTS_WIDE: [(f32, f32); 6] = [(330.0, 360.0), (1590.0, 360.0), (720.0, 220.0), (1650.0, 770.0), (270.0, 770.0), (1200.0, 220.0)];
const SLOTS_TALL: [(f32, f32); 6] = [(275.0, 430.0), (805.0, 430.0), (540.0, 260.0), (805.0, 770.0), (275.0, 770.0), (540.0, 600.0)];

pub fn flight(f: &Feature, w: &World, at: f32, slot: usize, t: f32, life: f32, kick: f32) -> Svgr<'static> {
    let age = t - at;
    if age < 0.0 || age > life {
        return Svgr::empty();
    }
    let (tx, ty) = pick(SLOTS_WIDE, SLOTS_TALL)[slot % 6];
    let side = if tx < mx() { -1.0 } else { 1.0 };
    let (ox, oy) = (dev_x() + side * 150.0 * dev_scale(at), dev_y(at) - 10.0);
    let p_in = clamp01(age / 0.32);
    let e = ease_out(p_in);
    let (cx, cy) = ((ox + tx) / 2.0, oy.min(ty) - 320.0);
    let bx = (1.0 - e) * (1.0 - e) * ox + 2.0 * (1.0 - e) * e * cx + e * e * tx;
    let by = (1.0 - e) * (1.0 - e) * oy + 2.0 * (1.0 - e) * e * cy + e * e * ty;
    let seed = at * 13.0;
    let out = ease_in(clamp01((age - (life - 0.3)) / 0.3));
    let at_camera = hash(seed + 5.0) < 0.4;
    let (x, y, grow) = if at_camera {
        (lerp(bx, mx() + (tx - mx()) * 0.35, out), lerp(by, my(), out * 0.6), 1.0 + 3.6 * out)
    } else {
        (bx + (tx - mx()) * 0.9 * out, by + (ty - my()) * 0.6 * out, 1.0 + 0.8 * out)
    };
    let scale = lerp(0.12, 1.0, back_out(p_in)) * (1.0 + 0.04 * kick) * grow;
    let rest = (hash(seed) - 0.5) * 10.0 + (age * 1.3 + seed).sin() * 2.5;
    let rot = lerp(42.0 * side, rest, e) + 16.0 * out * side;
    let flip = ((1.0 - e) * 1.35).cos().max(0.08);
    let mut ghosts = Vec::new();
    if age < 0.34 {
        for g in 1..4 {
            let k = g as f32;
            ghosts.push(fframes::svgr!(
                <g transform={Transform::translate((-k * 26.0 * side) as f64, (k * 30.0) as f64)} opacity={0.22 / k}>
                    <rect x="-220" y="-150" width="440" height="300" rx="24" fill={s(w.accent)} />
                </g>
            ));
        }
    }
    let body = card(f, w, age, 1.0 - clamp01(age / 0.45));
    fframes::svgr!(
        <g opacity={(1.0 - out) * clamp01(age / 0.05)} transform={Transform { translate_x: x as f64, translate_y: y as f64, rotate: rot.into(), scale: fframes::Scale::from(((scale * flip) as f64, scale as f64)), skew_y: ((1.0 - flip) * 12.0) as f64, ..Default::default() }}>
            {ghosts}
            {body}
        </g>
    )
}

pub fn shot_beats(sh: &Shot) -> Vec<f32> {
    let mut v: Vec<f32> = BEATS.iter().copied().filter(|b| *b >= sh.from + 0.1 && *b < sh.to - 0.15).collect();
    v.insert(0, sh.from);
    v.dedup_by(|a, b| (*a - *b).abs() < 0.12);
    v
}

pub fn drop_shot(sh: &Shot, t: f32, kick: f32, w: &World, ctx: &FFramesContext, behind: &mut Vec<Svgr<'static>>, front: &mut Vec<Svgr<'static>>, screen: &mut Vec<Svgr<'static>>) -> bool {
    let age = t - sh.from;
    let u = clamp01(age / (sh.to - sh.from));
    let f = &FEATURES[sh.index % FEATURES.len()];
    let beats = shot_beats(sh);
    let (tx, ty, size) = pick((mx(), 190.0, 120.0), (mx(), 300.0, 96.0));
    match sh.index % 4 {
        0 => {
            if let Some(img) = ctx.get_image(f.img) {
                behind.push(cover(img, (0.5, 0.5), 1.15 + 0.15 * u, 0.0, 0.5));
                behind.push(rect(0.0, 0.0, vw(), vh(), 0.0, s(w.backdrop), 0.45));
            }
            for (k, at) in beats.iter().take(3).enumerate() {
                let g = &FEATURES[(sh.index + k * 5) % FEATURES.len()];
                front.push(flight(g, &WORLDS[STROBE[(sh.index + k) % 6]], *at, sh.index + k * 2, t, 1.6, kick));
            }
            screen.push(slam(f.title, tx, ty, fit(f.title, vw() - 160.0, size, 0.52), HEAD, s(w.ink), w, age, if sh.index % 2 == 0 { -4.0 } else { 4.0 }));
            true
        }
        1 => {
            for (k, side) in [-1.0_f32, 1.0].iter().enumerate() {
                if let Some(img) = ctx.get_image(SCREENS[(sh.index + k * 3) % SCREENS.len()]) {
                    let e = ease_out((age - 0.04 * k as f32) / 0.3);
                    let (x, y, width) = pick((mx() + side * 470.0, my() + 40.0, 820.0), (mx(), my() + side * 430.0, 900.0));
                    let off = lerp(pick(1500.0, 1300.0), 0.0, e) * side;
                    let (dx, dy) = pick((off, 0.0), (0.0, off));
                    front.push(place(vec![framed(img, width, w, hit(t, sh.from, 0.4))], x + dx, y + dy, 1.0 + 0.05 * u, side * (3.0 - 2.0 * u), 1.0));
                }
            }
            front.push(place(vec![card(f, w, age, 1.0 - clamp01(age / 0.4))], mx(), my() + pick(40.0, 0.0), back_out((age - 0.1) / 0.25) * pick(1.05, 1.15), (age * 3.0).sin() * 3.0, clamp01((age - 0.1) / 0.05)));
            screen.push(text(mx(), vh() - pick(120.0, 260.0), pick(84.0, 64.0), MONO, s(w.accent), "middle", scramble(f.title, age, 0.35, sh.index as f32), 1.0));
            true
        }
        2 => {
            let (cols, rows) = pick((3, 2), (2, 3));
            let (gw, gh) = pick((560.0, 380.0), (500.0, 380.0));
            let (x0, y0) = (mx() - gw * (cols as f32 - 1.0) / 2.0, my() - gh * (rows as f32 - 1.0) / 2.0 + pick(40.0, 80.0));
            for (k, at) in beats.iter().take(cols * rows).enumerate() {
                let a = t - at;
                if a < 0.0 {
                    continue;
                }
                let g = &FEATURES[(sh.index * 3 + k) % FEATURES.len()];
                let gw2 = &WORLDS[STROBE[(sh.index + k) % 6]];
                let e = back_out(a / 0.16);
                let (cx, cy) = (x0 + (k % cols) as f32 * gw, y0 + (k / cols) as f32 * gh);
                front.push(place(vec![card(g, gw2, a, 1.0 - clamp01(a / 0.3))], cx, cy, lerp(1.7, 1.0, e) * 1.08, (hash(k as f32 + sh.index as f32) - 0.5) * 12.0 * (1.0 - e) + (hash(k as f32) - 0.5) * 4.0, clamp01(a / 0.03)));
            }
            true
        }
        _ => {
            let focus = (0.45 + 0.1 * hash(sh.index as f32), 0.45 + 0.1 * hash(sh.index as f32 + 1.0));
            let zoom = lerp(1.0, 2.4, ease_in_out(u)) + 0.06 * kick;
            if let Some(img) = ctx.get_image(f.img) {
                behind.push(cover(img, focus, zoom, lerp(-6.0, 4.0, u), 1.0));
                behind.push(rect(0.0, 0.0, vw(), vh(), 0.0, s("#000000"), 0.35));
            }
            behind.push(burst(mx(), my(), t, age, w, 26, 300.0 + 220.0 * zoom));
            let (lx, ly, ls) = pick((110.0, 520.0, 170.0), (70.0, 520.0, 130.0));
            screen.push(write_on(f.title, lx, ly, fit(f.title, vw() - 2.0 * lx, ls, 0.52), HEAD, s(w.ink), s(w.accent), (age - 0.04) / 0.6, "start"));
            screen.push(type_line(f.line, lx + 8.0, ly + pick(90.0, 80.0), pick(46.0, 40.0), MONO, s(w.accent), s(w.ink), age - 0.4, 36.0));
            false
        }
    }
}

pub fn shot_shows_dev(sh: &Shot) -> bool {
    sh.index % 4 == 0
}

pub fn brk(t: f32, w: &World, screen: &mut Vec<Svgr<'static>>) {
    for (i, at) in STABS.iter().enumerate() {
        let next = STABS.get(i + 1).copied().unwrap_or(T_RESUME);
        if t >= *at && t < next {
            screen.push(slam(STAB_WORDS[i], mx(), pick(300.0, 520.0), pick(300.0, 220.0) * (1.0 + 0.15 * i as f32), HEAD, s(w.ink), w, t - at, [-7.0, 6.0, -9.0][i]));
        }
    }
}

pub fn gap(t: f32, w: &World, front: &mut Vec<Svgr<'static>>, screen: &mut Vec<Svgr<'static>>) {
    let (fx, fy) = face_pos(t);
    for (k, at) in LAUGH.iter().enumerate() {
        let a = t - at;
        if (0.0..0.7).contains(&a) {
            let ang = hash(k as f32 * 2.3) * std::f32::consts::TAU;
            let r = 260.0 + hash(k as f32) * 180.0;
            front.push(sticker(LAUGH_WORDS[k % LAUGH_WORDS.len()], fx + ang.cos() * r, fy + ang.sin() * r * 0.6, 64.0 + 20.0 * hash(k as f32 + 4.0), (hash(k as f32 + 9.0) - 0.5) * 30.0, w, a, k % 2 == 0));
        }
    }
    screen.push(typewriter("wait for it", mx(), pick(200.0, 320.0), pick(64.0, 56.0), s(w.ink), s(w.accent), t - T_GAP, 18.0, "middle"));
}

pub fn finale(t: f32, ctx: &FFramesContext, behind: &mut Vec<Svgr<'static>>, screen: &mut Vec<Svgr<'static>>) {
    let (cols, rows) = pick((5, 4), (3, 6));
    let (tw, th) = (vw() / cols as f32, vh() / rows as f32);
    let b = last_before(BEATS, t).map(|(i, _)| i).unwrap_or(0);
    for k in 0..cols * rows {
        let (x, y) = ((k % cols) as f32 * tw, (k / cols) as f32 * th);
        let name = SCREENS[(k + b) % SCREENS.len()];
        let lit = hash(k as f32 * 3.1 + b as f32) > 0.35;
        let a = t - T_FINALE - (k as f32 * 0.013);
        if a < 0.0 {
            continue;
        }
        let pop = back_out(a / 0.2);
        if let Some(img) = ctx.get_image(name) {
            behind.push(place(
                vec![fframes::svgr!(<image href={img.href()} x={-tw / 2.0 + 4.0} y={-th / 2.0 + 4.0} width={tw - 8.0} height={th - 8.0} preserveAspectRatio="xMidYMid slice" />)],
                x + tw / 2.0,
                y + th / 2.0,
                pop,
                0.0,
                if lit { 1.0 } else { 0.35 },
            ));
        }
        let wk = &WORLDS[STROBE[(k + b) % 6]];
        behind.push(rect(x + 4.0, y + 4.0, tw - 8.0, th - 8.0, 10.0, s(wk.accent), if lit { 0.12 } else { 0.45 }));
    }
    for (i, at) in CHOPS.iter().enumerate() {
        let next = CHOPS.get(i + 1).copied().unwrap_or(T_OUTRO);
        if t >= *at && t < next {
            let w = &WORLDS[STROBE[i % 6]];
            screen.push(rect(0.0, my() - 150.0, vw(), 260.0, 0.0, s("#000000"), 0.72));
            screen.push(slam(CHOP_WORDS[i], mx(), my() + 60.0, fit(CHOP_WORDS[i], vw() - 140.0, 230.0, 0.5), HEAD, s(w.ink), w, t - at, if i % 2 == 0 { 3.0 } else { -3.0 }));
        }
    }
}

pub fn hud(t: f32, w: &World, shipped: usize) -> Svgr<'static> {
    let (x, y) = pick((vw() - 60.0, 70.0), (vw() - 50.0, 150.0));
    let fresh = last_before(DOWNBEATS, t).map(|(_, d)| t - d).unwrap_or(1.0);
    let n = format!("{shipped:02}");
    group(vec![
        text(x, y, 22.0, MONO, s(w.soft), "end", s("features"), 1.0),
        text(x, y + 62.0, 60.0 * (1.0 + 0.25 * (1.0 - clamp01(fresh / 0.15))), MONO, s(w.accent), "end", if fresh < 0.12 { scramble(&n, fresh, 0.12, t) } else { n }, 1.0),
    ])
}

fn dollars(n: u32) -> String {
    format!("${}", commas(n))
}

fn paper_path(pw: f32, h: f32) -> String {
    let teeth = (pw / 26.0).floor().max(1.0) as usize;
    let step = pw / teeth as f32;
    let mut d = format!("M {:.1} 0 L {:.1} 0 L {:.1} {:.1} ", -pw / 2.0, pw / 2.0, pw / 2.0, h);
    for k in 0..teeth {
        let x = pw / 2.0 - step * k as f32;
        d.push_str(&format!("L {:.1} {:.1} L {:.1} {:.1} ", x - step / 2.0, h + 13.0, x - step, h));
    }
    d.push('Z');
    d
}

pub fn stats(t: f32) -> Vec<Svgr<'static>> {
    let mut v = Vec::new();
    let (cols, gx, gy) = pick((4, 440.0, 0.0), (2, 470.0, 380.0));
    for (k, st) in STATS.iter().enumerate() {
        let a = t - T_OUTRO - 0.12 * k as f32;
        if a < 0.0 || t >= T_RECEIPT + 0.2 {
            continue;
        }
        let w = &WORLDS[STROBE[k % 6]];
        let (c, r) = ((k % cols) as f32, (k / cols) as f32);
        let x = mx() + (c - (cols as f32 - 1.0) / 2.0) * gx;
        let y = my() - pick(0.0, 190.0) + r * gy;
        let n = (st.value as f32 * ease_out(a / 0.7)).round() as u32;
        let bump = 1.0 + 0.2 * hit(t, T_OUTRO + 0.12 * k as f32 + 0.7, 0.25) + 0.06 * boom(t);
        let out = 1.0 - ease_in((t - T_RECEIPT) / 0.2);
        v.push(place(
            vec![
                text(0.0, 0.0, 120.0, MONO, s(w.accent), "middle", commas(n), 1.0),
                type_line(st.label, -(st.label.chars().count() as f32) * 36.0 * 0.3, 70.0, 36.0, MONO, s(w.ink), s(w.accent), a - 0.2, 30.0),
            ],
            x,
            y,
            back_out(a / 0.2) * bump,
            (hash(k as f32) - 0.5) * 6.0,
            out,
        ));
    }
    v
}

pub fn receipt(t: f32) -> Vec<Svgr<'static>> {
    const INK: &str = "#1b1712";
    const SOFT: &str = "#6f675c";
    const MONEY: &str = "#0e8a3a";
    const STAMP: &str = "#d22d43";
    const PAPER: &str = "#f3efe6";
    let a = t - T_RECEIPT;
    if a < 0.0 || t >= T_END_CARD {
        return Vec::new();
    }
    let step = (T_END_CARD - T_RECEIPT - 1.0) / (RECEIPT.len() as f32 + 1.0);
    let total: u32 = RECEIPT.iter().filter(|l| l.saved).map(|l| l.dollars).sum();
    let pw = pick(800.0, 940.0);
    let (left, right) = (-pw / 2.0 + 50.0, pw / 2.0 - 50.0);
    let (size, gap) = (pick(36.0, 42.0), pick(84.0, 100.0));
    let mut body = vec![
        text(0.0, 70.0, pick(46.0, 52.0), HEAD, s(INK), "middle", PRODUCT.to_uppercase(), 1.0),
        text(0.0, 108.0, pick(22.0, 26.0), MONO, s(SOFT), "middle", s("the last 30 days"), 1.0),
        fframes::svgr!(<line x1={left} y1="134" x2={right} y2="134" stroke={s(SOFT)} stroke-width="3" stroke-dasharray="10 9" />),
    ];
    let mut y = 134.0;
    let mut height = 160.0;
    for (k, l) in RECEIPT.iter().enumerate() {
        let ra = a - 0.1 - step * k as f32;
        if ra < 0.0 {
            break;
        }
        y += gap;
        height = lerp(height, y + gap * 0.55, ease_out(ra / 0.12));
        let n = (l.dollars as f32 * ease_out(ra / 0.4)).round() as u32;
        let op = clamp01(ra / 0.06);
        body.push(type_line(l.label, left, y, size, MONO, s(INK), s(INK), ra, 40.0));
        body.push(text(right, y, size, MONO, s(if l.paid { MONEY } else { INK }), "end", dollars(n), op));
        if !l.note.is_empty() {
            body.push(text(left, y + size * 0.82, size * 0.52, MONO, s(SOFT), "start", l.note.to_string(), op));
        }
    }
    let ta = a - 0.1 - step * RECEIPT.len() as f32;
    if ta >= 0.0 {
        y += gap * 1.25;
        height = lerp(height, y + gap * 0.6, ease_out(ta / 0.12));
        body.push(fframes::svgr!(<line x1={left} y1={y - gap * 0.75} x2={right} y2={y - gap * 0.75} stroke={s(INK)} stroke-width="4" />));
        body.push(text(left, y, size * 1.15, HEAD, s(INK), "start", s("you saved"), 1.0));
        let n = (total as f32 * ease_out(ta / 0.5)).round() as u32;
        body.push(place(vec![text(0.0, 0.0, size * 1.5, MONO, s(MONEY), "end", dollars(n), 1.0)], right, y, 1.0 + 0.25 * hit(t, T_RECEIPT + 0.6 + step * RECEIPT.len() as f32, 0.3), 0.0, 1.0));
        let sa = ta - 0.45;
        if sa > 0.0 {
            body.push(place(
                vec![
                    frame(-170.0, -60.0, 340.0, 110.0, 16.0, s(STAMP), 8.0, 1.0),
                    text(0.0, 22.0, 64.0, HEAD, s(STAMP), "middle", s("PAID OFF"), 1.0),
                ],
                pw * 0.18,
                y - gap * 2.2,
                lerp(2.4, 1.0, back_out(sa / 0.16)),
                -14.0,
                0.9 * clamp01(sa / 0.04),
            ));
        }
    }
    let lift = lerp(-60.0, 0.0, ease_out(a / 0.25));
    let top = pick(110.0, 300.0) + lift;
    vec![place(
        vec![fframes::svgr!(<path d={paper_path(pw, height)} fill={s(PAPER)} />), group(body)],
        mx(),
        top,
        1.0 + 0.03 * boom(t),
        (a * 1.4).sin() * 1.2,
        clamp01(a / 0.08),
    )]
}

pub fn end_card(t: f32, w: &World, ctx: &FFramesContext) -> Vec<Svgr<'static>> {
    let a = t - T_END_CARD;
    if a < 0.0 {
        return Vec::new();
    }
    let mut v = Vec::new();
    let y = pick(300.0, 520.0);
    match ctx.get_image(LOGO) {
        Some(img) => v.push(picture(img, mx(), y, lerp(pick(1100.0, 900.0), pick(620.0, 640.0), spring(a * 1.1).min(1.0)), clamp01(a / 0.08))),
        None => v.push(write_on(PRODUCT, mx(), y + 60.0, pick(260.0, 220.0), HEAD, s(w.ink), s(w.accent), a / 0.6, "middle")),
    }
    v.push(typewriter(TAGLINE, mx(), y + pick(140.0, 170.0), pick(44.0, 40.0), s(w.accent), s(w.ink), a - 0.45, 34.0, "middle"));
    v
}

pub fn credits(t: f32) -> Svgr<'static> {
    let end = clamp01((t - T_END_CARD - 0.3) / 0.3);
    let op = lerp(0.62, 1.0, end) * clamp01((t - 0.3) / 0.4) * (1.0 - clamp01((t - (T_END - 0.4)) / 0.38));
    let (x, y, anchor) = pick((vw() - 36.0, vh() - 14.0, "end"), (mx(), vh() - 44.0, "middle"));
    let size = lerp(pick(20.0, 22.0), pick(28.0, 30.0), end);
    let (sx, sy, song_anchor) = pick((36.0, vh() - 14.0, "start"), (mx(), vh() - 80.0, "middle"));
    let song_op = lerp(0.55, 0.9, end) * clamp01((t - 0.3) / 0.4) * (1.0 - clamp01((t - (T_END - 0.4)) / 0.38));
    fframes::svgr!(
        <g>
            <text x={sx} y={sy - 44.0 * end} font-family={MONO} font-size={pick(17.0, 19.0)} font-weight="700" fill="#ffffff" stroke="#000000" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor={song_anchor} opacity={song_op}>{SONG.to_string()}</text>
            <text x={x} y={y - 10.0 * end} font-family={MONO} font-size={size} font-weight="700" fill="#ffffff" stroke="#000000" stroke-width="4" paint-order="stroke" stroke-linejoin="round" text-anchor={anchor} opacity={op}>{MAKER.to_string()}</text>
        </g>
    )
}
