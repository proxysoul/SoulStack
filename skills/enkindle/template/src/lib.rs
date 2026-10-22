use fframes::AudioTimestamp::*;
use fframes::{AudioMap, AudioTrack, Color, Duration, FFramesContext, Frame, Shader, ShaderUniforms, Svgr, Transform, Video, include_media_dir};

pub mod content;
pub mod dev;
pub mod draw;
pub mod kinetic;
pub mod lay;
pub mod scenes;
pub mod song;
pub mod theme;
pub mod timeline;
pub mod util;

use content::*;
use draw::*;
use lay::*;
use scenes::*;
use song::*;
use theme::*;
use timeline::*;
use util::*;

include_media_dir!(pub struct EditMedia, "media");

pub struct Edit<'a, const TALL: bool> {
    pub media: &'a EditMedia,
    bg: Shader,
    post: Shader,
    starts: Vec<f32>,
}

impl<'a, const TALL: bool> Edit<'a, TALL> {
    pub fn new(media: &'a EditMedia) -> Self {
        lay::init(TALL);
        Self { media, bg: Shader::sksl(include_str!("../shaders/bg.sksl")), post: Shader::sksl(include_str!("../shaders/post.sksl")), starts: shot_starts() }
    }
}

impl<const TALL: bool> std::fmt::Debug for Edit<'_, TALL> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Edit").field("tall", &TALL).finish()
    }
}

struct Post {
    rgb: f32,
    glitch: f32,
    zoom: f32,
    center: (f32, f32),
    whip: f32,
    invert: f32,
    barrel: f32,
    scan: f32,
    grain: f32,
    pix: f32,
}

fn on_frames(t: f32, at: f32, frames: f32) -> bool {
    let f = (t * 30.0).round();
    let s = (at * 30.0).round();
    f >= s && f < s + frames
}

fn post_params(t: f32, kick: f32, starts: &[f32]) -> Post {
    let mut p = Post { rgb: 1.5, glitch: 0.0, zoom: 0.0, center: (mx(), my()), whip: 0.0, invert: 0.0, barrel: 0.0, scan: 0.0, grain: 0.04, pix: 0.0 };
    match act_at(t) {
        Act::Drop | Act::Break => {
            p.rgb += 6.0 * kick + 10.0 * boom(t) + 4.0 * low(t);
            p.barrel = 0.5 * boom(t);
            p.scan = 0.12;
        }
        Act::Finale => {
            p.rgb += 6.0 * beat_pulse(t);
            p.scan = 0.3;
        }
        Act::Intro | Act::Build => p.rgb += 6.0 * kick,
        _ => {}
    }
    for at in SECTION_HITS {
        let h = hit(t, at, 0.16);
        p.rgb += 30.0 * h;
        p.glitch = p.glitch.max(h * 0.65);
        p.barrel += 0.7 * h;
    }
    for at in [T_CHAPTER2, T_DROP2, T_FINALE, T_OUTRO] {
        if t < at {
            p.zoom = p.zoom.max(ease_in(clamp01((t - (at - 0.24)) / 0.24)) * 1.2);
        }
    }
    if let Some(sh) = shot_at(starts, t) {
        let k = 1.0 - clamp01((t - sh.from) / 0.08);
        p.glitch = p.glitch.max(0.7 * k);
        p.rgb += 26.0 * k;
    }
    if let Some((next, dt)) = next_cut(starts, t) {
        let e = ease_in(1.0 - dt / EXIT);
        p.rgb += 20.0 * e;
        let whip = pick(280.0, 180.0);
        match next % 4 {
            0 => p.whip = whip * e,
            2 => p.whip = -whip * e,
            1 => p.zoom = p.zoom.max(0.9 * e),
            _ => {
                p.glitch = p.glitch.max(0.7 * e);
                p.pix = if e > 0.5 { 14.0 } else { 0.0 };
            }
        }
    }
    for at in VOICE_2 {
        p.rgb += 22.0 * hit(t, at, 0.14);
        p.glitch = p.glitch.max(0.45 * hit(t, at, 0.14));
    }
    for at in LAUGH {
        p.rgb += 14.0 * hit(t, at, 0.12);
        p.glitch = p.glitch.max(0.22 * hit(t, at, 0.1));
    }
    for (i, at) in LYRICS.iter().map(|(a, _)| *a).enumerate() {
        if i >= 8 && on_frames(t, at, 2.0) {
            p.invert = 1.0;
        }
    }
    for at in [T_DROP1, T_RESUME, T_DROP2] {
        if on_frames(t, at, 2.0) {
            p.invert = 1.0;
        }
    }
    for at in STABS {
        let h = hit(t, at, 0.2);
        p.rgb += 26.0 * h;
        p.glitch = p.glitch.max(0.5 * h);
    }
    if (T_THROUGH..T_DROP1).contains(&t) {
        p.zoom = p.zoom.max(ease_in((t - T_THROUGH) / (T_DROP1 - T_THROUGH)) * 1.6);
    }
    if (STABS[2]..T_RESUME).contains(&t) {
        p.zoom = p.zoom.max(ease_in((t - STABS[2]) / (T_RESUME - STABS[2])) * 1.6);
    }
    p
}

struct Cam {
    fx: f32,
    fy: f32,
    zoom: f32,
    rot: f32,
    ox: f32,
    oy: f32,
    skew: f32,
}

fn camera(t: f32, kick: f32, starts: &[f32]) -> Cam {
    let mut c = Cam { fx: mx(), fy: my(), zoom: 1.0, rot: 0.0, ox: 0.0, oy: 0.0, skew: 0.0 };
    match act_at(t) {
        Act::Intro => {
            c.zoom = 1.0 + 0.08 * ease_in_out(t / 3.6) + 0.07 * kick;
            if let Some((i, at)) = last_before(&LYRICS.map(|(a, _)| a), t) {
                c.rot = if i % 2 == 0 { 2.5 } else { -2.5 } * ease_out((t - at) / 0.2);
            }
            if (W_AMIGO..W_PUNCH).contains(&t) {
                let e = ease_out((t - W_AMIGO) / 0.3);
                c.zoom = lerp(c.zoom, 1.55, e);
                c.fy = lerp(my(), face_pos(t).1, e);
                c.rot = -3.0 * e;
            }
            for (at, _) in LYRICS.iter().skip(8) {
                c.zoom += 0.18 * hit(t, *at, 0.22);
                c.ox += (hash(*at) - 0.5) * 80.0 * hit(t, *at, 0.15);
            }
        }
        Act::Build => {
            c.zoom = 1.0 + 0.03 * (t * 0.8).sin() + 0.06 * kick + 0.04 * low(t);
            c.rot = (t * 0.7).sin() * 1.6;
            if (T_CHAPTER2 - 0.12..T_CHAPTER2).contains(&t) {
                let e = ease_in(1.0 - (T_CHAPTER2 - t) / 0.12);
                c.ox -= pick(1100.0, 700.0) * e;
                c.skew -= 14.0 * e;
            }
            if (VOICE_2[0]..VOICE_2[8] + 0.05).contains(&t) {
                let e = ease_out((t - VOICE_2[0]) / 0.12) * (1.0 - ease_in((t - VOICE_2[8] + 0.13) / 0.18));
                c.fy = lerp(my(), face_pos(t).1, e);
                c.zoom *= lerp(1.0, 2.35, e);
                c.ox += (hash(t * 60.0) - 0.5) * 70.0 * e;
                c.oy += (hash(t * 60.0 + 3.0) - 0.5) * 70.0 * e;
                c.rot += (hash(t * 45.0 + 1.0) - 0.5) * 9.0 * e;
                for at in VOICE_2 {
                    c.zoom *= 1.0 + 0.07 * hit(t, at, 0.15);
                }
            }
            if (T_ROLL..T_DROP1).contains(&t) {
                let u = clamp01((t - T_ROLL) / (CALLS[0] - T_ROLL));
                c.ox += (hash(t * 60.0) - 0.5) * 30.0 * u * (0.4 + kick);
                c.oy += (hash(t * 60.0 + 7.0) - 0.5) * 30.0 * u * (0.4 + kick);
            }
            for (i, at) in CALLS.iter().enumerate() {
                c.zoom += 0.14 * hit(t, *at, 0.25);
                c.rot += [-5.0, 5.0, -7.0][i] * hit(t, *at, 0.3);
            }
            if t >= T_THROUGH {
                let e = ease_in((t - T_THROUGH) / (T_DROP1 - T_THROUGH));
                c.fy = lerp(c.fy, logo_pos(t).1, ease_out(e * 2.0));
                c.zoom *= lerp(1.0, 8.0, e);
                c.rot += 12.0 * e;
            }
        }
        Act::Drop => {
            c.zoom = 1.03 + 0.07 * boom(t) + 0.02 * kick + 0.025 * low(t);
            if let Some((i, at)) = last_before(DOWNBEATS, t) {
                c.rot = if i % 2 == 0 { 2.2 } else { -2.2 } * ease_out((t - at) / 0.25);
            }
            let shake = boom(t) + 0.4 * kick;
            c.ox = (hash(t * 60.0) - 0.5) * 30.0 * shake;
            c.oy = (hash(t * 60.0 + 3.0) - 0.5) * 30.0 * shake;
            if let Some(sh) = shot_at(starts, t) {
                let k = 1.0 - ease_out((t - sh.from) / 0.22);
                c.zoom *= 1.0 + 0.17 * k;
                c.rot += if sh.index % 2 == 0 { 3.5 } else { -3.5 } * k;
            }
            if let Some((next, dt)) = next_cut(starts, t) {
                let e = ease_in(1.0 - dt / EXIT);
                let whip = pick(1100.0, 700.0);
                match next % 4 {
                    0 => c.ox -= whip * e,
                    1 => c.zoom *= 1.0 + 0.6 * e,
                    2 => c.ox += whip * e,
                    _ => {
                        c.rot += 28.0 * e;
                        c.zoom *= 1.0 + 0.3 * e;
                    }
                }
            }
        }
        Act::Break => {
            let face = face_pos(t);
            let stage = STABS.iter().filter(|a| t >= **a).count();
            c.zoom = 1.04 + 0.05 * clamp01((t - T_BREAK) / 0.5);
            if (1..3).contains(&stage) {
                let at = STABS[stage - 1];
                let e = ease_out((t - at) / 0.09);
                let (z0, z1) = if stage == 1 { (1.09, 1.65) } else { (1.65, 2.6) };
                c.zoom = lerp(z0, z1, e) * (1.0 + 0.04 * (t - at));
                let pull = if stage == 1 { e } else { 1.0 };
                c.fx = lerp(mx(), face.0, pull);
                c.fy = lerp(my(), face.1, pull);
                c.rot = if stage == 1 { -4.0 * e } else { lerp(-4.0, 5.0, e) };
            }
            if stage == 3 {
                let u = clamp01((t - STABS[2]) / (T_RESUME - STABS[2]));
                let (lx, ly) = logo_pos(t);
                let e = ease_in(u);
                c.fx = lerp(face.0, lx, ease_out(u * 1.8));
                c.fy = lerp(face.1, ly, ease_out(u * 1.8));
                c.zoom = lerp(2.6, 1.2, ease_out(u * 3.0)) * 14.0_f32.powf(e);
                c.rot = lerp(5.0, 8.0, e);
            }
        }
        Act::Gap => {
            let lp = laugh_pulse(t);
            c.zoom = 1.0 + 0.16 * ease_in_out((t - T_GAP) / 1.4) + 0.05 * lp;
            c.fy = my() - 20.0;
            c.oy += 10.0 * lp;
            c.rot = (t * 1.1).sin() * 1.2 + (hash(t * 40.0) - 0.5) * 3.0 * lp;
        }
        Act::Finale => {
            c.zoom = 1.0 + 0.05 * beat_pulse(t) + 0.08 * ease_in_out((t - T_FINALE) / (T_OUTRO - T_FINALE));
            c.rot = (t * 0.9).sin() * 2.0;
            for at in CHOPS {
                c.zoom += 0.1 * hit(t, at, 0.3);
            }
        }
        Act::Outro => {
            c.zoom = 1.0 + 0.02 * (t - T_OUTRO) + 0.06 * boom(t);
            c.rot = (t * 0.8).sin() * 0.8;
        }
    }
    for at in [T_DROP1, T_RESUME, T_DROP2, T_FINALE] {
        if t >= at && t < at + 0.1 {
            let w = 1.0 - ease_out((t - at) / 0.1);
            c.skew += 24.0 * w;
            c.ox -= pick(260.0, 160.0) * w;
        }
    }
    c
}

fn bg_image(t: f32, starts: &[f32]) -> (&'static str, f32) {
    let bar = last_before(DOWNBEATS, t).map(|(i, _)| i).unwrap_or(0);
    match act_at(t) {
        Act::Intro => (SCREENS[0], 0.0),
        Act::Build => (chapter_at(t).map(|(_, c)| c.img).unwrap_or(SCREENS[0]), 0.17),
        Act::Drop => (shot_at(starts, t).map(|sh| FEATURES[(sh.index + 1) % FEATURES.len()].img).unwrap_or(SCREENS[bar % SCREENS.len()]), 0.28),
        Act::Break => (SCREENS[bar % SCREENS.len()], 0.2),
        Act::Gap => (SCREENS[(bar + 2) % SCREENS.len()], 0.1),
        Act::Finale => (SCREENS[0], 0.08),
        Act::Outro => (SCREENS[0], 0.06),
    }
}

impl<const TALL: bool> Video for Edit<'_, TALL> {
    const FPS: usize = 30;
    const WIDTH: usize = if TALL { 1080 } else { 1920 };
    const HEIGHT: usize = if TALL { 1920 } else { 1080 };
    const BACKGROUND_COLOR: Color = Color::BLACK;

    fn duration(&self) -> Duration<'_> {
        Duration::Seconds(T_END)
    }

    fn audio(&self) -> AudioMap<'_> {
        AudioMap::from([AudioTrack::new("track.mp3", Second(0.0)..Eof).gain_db(-7.5).fade_out(0.9)])
    }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.global_index as f32 / 30.0;
        let act = act_at(t);
        let w = &WORLDS[world_at(t)];
        let kick = kick_pulse(t);
        let (fw, fh) = (vw(), vh());
        let view = format!("0 0 {fw} {fh}");
        let shot = shot_at(&self.starts, t);

        let (img_name, img_mix) = bg_image(t, &self.starts);
        let warp = match act {
            Act::Build => 0.08 + 0.92 * ease_in((t - T_BUILD) / (T_DROP1 - T_BUILD)),
            Act::Break => 0.3 + 0.7 * clamp01((t - STABS[2]) / 0.3),
            Act::Drop => 0.14 + 0.3 * kick,
            Act::Finale => 0.3,
            _ => 0.0,
        };
        let cells = match act {
            Act::Intro => 0.55,
            Act::Build => 0.45,
            Act::Gap => 0.25,
            Act::Outro => 0.4,
            _ => 1.0,
        };
        let dark = if act == Act::Gap { 0.35 } else { 0.0 };
        let (pb, pa, ps) = (rgb(w.backdrop), rgb(w.accent), rgb(w.spark));
        let bg_layer = match ctx.get_image(img_name).or_else(|| ctx.get_image(LOGO)) {
            Some(img) => {
                let layer = self.bg.draw(
                    &frame,
                    ShaderUniforms::new()
                        .float("uT", t)
                        .float("uKick", kick.max(boom(t)).max(0.5 * low(t)))
                        .float("uWarp", warp)
                        .float("uCells", cells)
                        .float("uImgMix", img_mix)
                        .float("uDark", dark)
                        .float4("uBackdrop", pb[0], pb[1], pb[2], 1.0)
                        .float4("uAccent", pa[0], pa[1], pa[2], 1.0)
                        .float4("uSpark", ps[0], ps[1], ps[2], 1.0)
                        .image("uImg", img)
                        .float2("uImgSize", img.image.width as f32, img.image.height as f32),
                );
                fframes::svgr!(<image href={layer.href()} x="0" y="0" width={fw} height={fh} />)
            }
            None => rect(0.0, 0.0, fw, fh, 0.0, s(w.backdrop), 1.0),
        };

        let mut behind: Vec<Svgr<'static>> = Vec::new();
        let mut front: Vec<Svgr<'static>> = Vec::new();
        let mut screen: Vec<Svgr<'static>> = Vec::new();
        let mut shows_dev = true;

        match act {
            Act::Intro => intro(t, w, &mut front, &mut screen),
            Act::Build => build(t, w, ctx, &mut front, &mut screen),
            Act::Drop => {
                if let Some(sh) = &shot {
                    shows_dev = shot_shows_dev(sh);
                    drop_shot(sh, t, kick, w, ctx, &mut behind, &mut front, &mut screen);
                }
            }
            Act::Break => brk(t, w, &mut screen),
            Act::Gap => gap(t, w, &mut front, &mut screen),
            Act::Finale => {
                shows_dev = false;
                finale(t, ctx, &mut behind, &mut screen);
            }
            Act::Outro => {
                shows_dev = t >= T_END_CARD;
                screen.extend(stats(t));
                screen.extend(receipt(t));
                screen.extend(end_card(t, w, ctx));
            }
        }

        let dev_op = match act {
            Act::Intro => clamp01(t / 0.25),
            Act::Outro => clamp01((t - T_END_CARD - 0.1) / 0.3),
            _ => 1.0,
        };
        let dev_layer = if shows_dev && dev_op > 0.0 { place(vec![dev::dev(w, &pose(t, kick))], dev_x(), dev_y(t), dev_scale(t), 0.0, dev_op) } else { Svgr::empty() };
        let spark_layer = if shows_dev && matches!(act, Act::Drop | Act::Intro) { sparks(t, w) } else { Svgr::empty() };
        let lines_layer = if act == Act::Drop { kinetic::streaks(mx(), my(), w, 0.4 + 0.6 * boom(t), t, 18) } else { Svgr::empty() };
        let hud_layer = if matches!(act, Act::Drop | Act::Break) { hud(t, w, shot.as_ref().map(|s| s.index + 1).unwrap_or(self.starts.partition_point(|x| *x <= t))) } else { Svgr::empty() };
        let cam = camera(t, kick, &self.starts);
        let white = flash(t);
        let black = (1.0 - clamp01(t / 0.12)).max(ease_in((t - (T_END - 0.4)) / 0.38));

        let scene = fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={view.clone()} width={fw} height={fh}>
                <defs>
                    <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#2b2f32" />
                        <stop offset="1" stop-color="#0e1011" />
                    </linearGradient>
                    <linearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" stop-color={s(w.spark)} stop-opacity="0.95" />
                        <stop offset="0.45" stop-color={s(w.accent)} stop-opacity="0.8" />
                        <stop offset="1" stop-color={s(w.accent)} stop-opacity="0" />
                    </linearGradient>
                    <filter id="fireGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" />
                    </filter>
                    <radialGradient id="faceLight" cx="0.5" cy="1.05" r="0.9">
                        <stop offset="0" stop-color={s(w.accent)} stop-opacity="0.55" />
                        <stop offset="1" stop-color={s(w.accent)} stop-opacity="0" />
                    </radialGradient>
                </defs>
                {bg_layer}
                <g transform={Transform { translate_x: (mx() + cam.ox) as f64, translate_y: (my() + cam.oy) as f64, rotate: cam.rot.into(), scale: fframes::Scale::from((cam.zoom as f64, cam.zoom as f64)), skew_x: cam.skew as f64, ..Default::default() }}>
                    <g transform={Transform::translate(-cam.fx as f64, -cam.fy as f64)}>
                        {behind}
                        {dev_layer}
                        {spark_layer}
                        {front}
                    </g>
                </g>
                {lines_layer}
                {screen}
                {hud_layer}
                <rect width={fw} height={fh} fill="#ffffff" opacity={white * 0.85} />
                <rect width={fw} height={fh} fill="#000000" opacity={black} />
            </svg>
        );

        let fx = post_params(t, kick, &self.starts);
        match ctx.render_svgr(scene, fw as u32, fh as u32) {
            Some(img) => {
                let out = self.post.draw(
                    &frame,
                    ShaderUniforms::new()
                        .image("uScene", &img)
                        .float2("uSize", fw, fh)
                        .float("uT", t)
                        .float("uRgb", fx.rgb)
                        .float("uGlitch", fx.glitch)
                        .float("uZoom", fx.zoom)
                        .float2("uCenter", fx.center.0, fx.center.1)
                        .float("uWhip", fx.whip)
                        .float("uInvert", fx.invert)
                        .float("uBarrel", fx.barrel)
                        .float("uScan", fx.scan)
                        .float("uGrain", fx.grain)
                        .float("uPix", fx.pix)
                        .float4("uTint", 0.0, 0.0, 0.0, 0.0),
                );
                fframes::svgr!(
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox={view} width={Self::WIDTH} height={Self::HEIGHT}>
                        <image href={out.href()} x="0" y="0" width={fw} height={fh} />
                        {credits(t)}
                    </svg>
                )
            }
            None => fframes::svgr!(
                <svg xmlns="http://www.w3.org/2000/svg" viewBox={view} width={Self::WIDTH} height={Self::HEIGHT}>
                    <rect width={fw} height={fh} fill="#400010" />
                    <text x={mx()} y={my()} font-family={MONO} font-size="48" fill="#ffffff" text-anchor="middle">"post pass unavailable"</text>
                </svg>
            ),
        }
    }
}
