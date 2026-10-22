use crate::draw::*;
use crate::theme::World;
use crate::util::*;
use fframes::{Svgr, Transform};

const SIL: &str = "#050607";

pub struct Pose {
    pub t: f32,
    pub kick: f32,
    pub smirk: f32,
    pub glint: f32,
    pub sweat: f32,
    pub wink: f32,
    pub glow: f32,
    pub fire: f32,
    pub laugh: f32,
}

fn flames(w: &World, t: f32, k: f32, fire: f32) -> Svgr<'static> {
    if fire <= 0.01 {
        return Svgr::empty();
    }
    let mut tongues = Vec::new();
    for i in 0..9 {
        let fi = i as f32;
        let x = -400.0 + fi * 100.0 + (t * 2.3 + fi * 1.9).sin() * 18.0;
        let edge = 1.0 - (x.abs() / 600.0) * 0.4;
        let flick = 0.5 + 0.5 * (t * 8.1 + fi * 2.7).sin() * (t * 5.3 + fi).cos();
        let h = fire * edge * (260.0 + 170.0 * flick + 230.0 * k);
        let sway = (t * 6.0 + fi * 1.3).sin() * 40.0;
        let hw = 70.0 + 20.0 * (t * 4.0 + fi).sin();
        tongues.push(path(
            format!(
                "M {:.1} 30 C {:.1} {:.1} {:.1} {:.1} {:.1} {:.1} C {:.1} {:.1} {:.1} {:.1} {:.1} {:.1} C {:.1} {:.1} {:.1} {:.1} {:.1} 30 Z",
                x - hw, x - hw * 1.1, -h * 0.3, x - hw * 0.2 + sway * 0.3, -h * 0.45, x - hw * 0.25 + sway * 0.6, -h * 0.7,
                x + sway * 0.5, -h * 0.85, x + sway, -h * 0.95, x + sway * 1.1, -h,
                x + hw * 0.5 + sway * 0.4, -h * 0.55, x + hw * 1.1, -h * 0.3, x + hw
            ),
            s("url(#fireGrad)"),
            s("none"),
            0.0,
            0.9,
        ));
    }
    let mut embers = Vec::new();
    for i in 0..22 {
        let fi = i as f32;
        let life = (t * 0.9 + hash(fi)) % 1.0;
        let y = -life * 560.0;
        let x = (hash(fi * 2.3) - 0.5) * 760.0 + (t * 2.0 + fi).sin() * 30.0 * life;
        embers.push(dot(x, y, 2.0 + hash(fi * 5.1) * 3.0, s(w.spark), fire * (1.0 - life)));
    }
    fframes::svgr!(
        <g>
            <g filter="url(#fireGlow)" opacity="0.85">{tongues}</g>
            {embers}
        </g>
    )
}
pub fn mark(w: &World, t: f32, r: f32, look: (f32, f32), wink: f32) -> Svgr<'static> {
    let breathe = 1.0 + 0.04 * (t * 3.0).sin();
    let lid = clamp01(wink);
    let mut v = vec![
        dot(0.0, 0.0, r * 1.6, s(w.accent), 0.1),
        dot(0.0, 0.0, r * breathe, s(w.raised), 1.0),
        ring(0.0, 0.0, r * breathe, s(w.accent), r * 0.14, 1.0),
    ];
    if lid < 0.8 {
        v.push(dot(look.0 * r * 0.3, look.1 * r * 0.3, r * 0.42 * (1.0 - lid), s(w.spark), 1.0));
        v.push(dot(look.0 * r * 0.3 + r * 0.12, look.1 * r * 0.3 - r * 0.14, r * 0.12, s(w.ink), 0.9));
    } else {
        v.push(line(-r * 0.4, 0.0, r * 0.4, 0.0, s(w.spark), r * 0.16, 1.0));
    }
    group(v)
}

pub fn dev(w: &World, p: &Pose) -> Svgr<'static> {
    let t = p.t;
    let k = p.kick;
    let sway = (t * 1.3).sin() * 4.0 + (t * 31.0).sin() * 5.0 * p.laugh;
    let nod = k * 8.0 - 26.0 * p.laugh * (1.0 - (t * 23.0).sin().abs() * 0.4);
    let tilt = -k * 2.2 + (t * 0.9).sin() * 1.2 - 9.0 * p.laugh;
    let rim = s(w.accent);

    let mut back = vec![fframes::svgr!(
        <ellipse cx="0" cy="-120" rx="560" ry="360" fill={s(w.accent)} opacity={0.07 + 0.10 * k + 0.08 * p.glow} />
    )];
    back.push(flames(w, t, k, p.fire));
    back.push(path(
        s("M -480 440 C -470 170 -340 46 -150 22 L 150 22 C 340 46 470 170 480 440 Z"),
        s(SIL),
        rim.clone(),
        3.0,
        1.0,
    ));
    back.push(path(s("M -150 22 C -120 60 -60 84 0 84 C 60 84 120 60 150 22"), s("none"), rim.clone(), 2.0, 0.35));
    back.push(rect(-40.0, -110.0, 80.0, 140.0, 20.0, s(SIL), 1.0));

    let mut head = Vec::new();
    head.push(fframes::svgr!(<ellipse cx="-86" cy="-164" rx="15" ry="26" fill={s(SIL)} stroke={rim.clone()} stroke-width="2.5" />));
    head.push(fframes::svgr!(<ellipse cx="86" cy="-164" rx="15" ry="26" fill={s(SIL)} stroke={rim.clone()} stroke-width="2.5" />));
    head.push(fframes::svgr!(<ellipse cx="0" cy="-172" rx="86" ry="98" fill={s(SIL)} stroke={rim.clone()} stroke-width="3" />));
    head.push(fframes::svgr!(<ellipse cx="0" cy="-172" rx="86" ry="98" fill="url(#faceLight)" opacity={0.75 + 0.25 * k} />));

    for lx in [-80.0_f32, 14.0] {
        head.push(rect(lx, -188.0, 66.0, 40.0, 12.0, s(w.sunken), 0.95));
        head.push(rect(lx, -188.0, 66.0, 40.0, 12.0, s(w.accent), 0.16 + 0.2 * k));
        for b in 0..4 {
            let yy = -184.0 + ((t * 70.0 + b as f32 * 9.0 + lx) % 34.0).abs();
            let wd = 14.0 + hash(b as f32 + lx + (t * 4.0).floor()) * 34.0;
            head.push(rect(lx + 8.0, yy, wd, 2.6, 1.3, s(w.accent), 0.85));
        }
        head.push(frame(lx, -188.0, 66.0, 40.0, 12.0, s(w.ink), 5.0, 0.92));
    }
    head.push(path(s("M -14 -170 Q 0 -178 14 -170"), s("none"), s(w.ink), 5.0, 0.92));
    head.push(line(-80.0, -172.0, -94.0, -178.0, s(w.ink), 4.0, 0.8));
    head.push(line(80.0, -172.0, 94.0, -178.0, s(w.ink), 4.0, 0.8));

    if p.glint > 0.01 {
        let g = clamp01(p.glint);
        head.push(path(s("M -70 -150 L -48 -188 L -36 -188 L -58 -150 Z"), s("#ffffff"), s("none"), 0.0, 0.85 * g));
        head.push(path(s("M 24 -150 L 46 -188 L 54 -188 L 32 -150 Z"), s("#ffffff"), s("none"), 0.0, 0.7 * g));
        let sz = 26.0 * g;
        head.push(path(
            format!("M 70 {} Q 72 -194 {} -192 Q 72 -190 70 {} Q 68 -190 {} -192 Q 68 -194 70 {} Z", -192.0 - sz, 70.0 + sz, -192.0 + sz, 70.0 - sz, -192.0 - sz),
            s("#ffffff"),
            s("none"),
            0.0,
            g,
        ));
    }

    let sm = clamp01(p.smirk);
    if p.laugh > 0.01 {
        let open = 18.0 + 26.0 * p.laugh;
        head.push(path(
            format!("M -38 -118 Q 0 -126 38 -118 Q 30 {:.1} 0 {:.1} Q -30 {:.1} -38 -118 Z", -118.0 + open, -118.0 + open * 1.25, -118.0 + open),
            s("#14080a"),
            s(w.ink),
            4.0,
            1.0,
        ));
        head.push(path(s("M -30 -118 Q 0 -123 30 -118 L 28 -110 Q 0 -114 -28 -110 Z"), s(w.ink), s("none"), 0.0, 0.9));
    } else {
        head.push(path(
            format!("M -30 -108 Q 2 {:.1} 30 {:.1}", -104.0 + 3.0 * sm, -110.0 - 14.0 * sm),
            s("none"),
            s(w.ink),
            5.0,
            0.92,
        ));
        if sm > 0.3 {
            head.push(path(format!("M 30 {:.1} q 7 -1 8 -9", -110.0 - 14.0 * sm), s("none"), s(w.ink), 3.0, sm));
        }
    }

    head.push(path(s("M -96 -190 C -100 -266 -52 -298 0 -298 C 52 -298 100 -266 96 -190 Z"), s(SIL), rim.clone(), 3.0, 1.0));
    head.push(path(s("M -114 -196 C -62 -218 62 -218 114 -196 C 72 -178 -72 -178 -114 -196 Z"), s(SIL), rim.clone(), 2.5, 1.0));
    head.push(dot(0.0, -298.0, 6.0, s(SIL), 1.0));
    head.push(place(vec![mark(w, t, 12.0, (0.6, 0.0), 0.0)], 0.0, -250.0, 1.0, 0.0, 0.95));

    if p.sweat > 0.01 {
        let fall = ((t * 1.6) % 1.0) * 60.0;
        head.push(path(
            format!("M 104 {} C 116 {} 118 {} 104 {} C 90 {} 92 {} 104 {} Z", -236.0 + fall, -218.0 + fall, -206.0 + fall, -200.0 + fall, -206.0 + fall, -218.0 + fall, -236.0 + fall),
            s("#8fd3ff"),
            s("#ffffff"),
            2.0,
            p.sweat,
        ));
    }

    let head_g = fframes::svgr!(
        <g transform={Transform { translate_x: 0.0, translate_y: nod as f64, rotate: tilt.into(), ..Default::default() }}>
            {head}
        </g>
    );

    let mut lid = Vec::new();
    lid.push(fframes::svgr!(<rect x="-336" y="0" width="672" height="436" rx="30" fill="url(#lidGrad)" stroke={s(w.accent)} stroke-width="2" stroke-opacity="0.35" />));
    lid.push(frame(-326.0, 10.0, 652.0, 416.0, 24.0, s("#ffffff"), 1.5, 0.05));
    lid.push(rect(-330.0, -2.0, 660.0, 6.0, 3.0, s(w.accent), 0.65 + 0.35 * k));
    lid.push(dot(0.0, 212.0, 120.0 + 30.0 * k, s(w.accent), 0.10 + 0.22 * k + 0.1 * p.glow));
    lid.push(place(vec![mark(w, t, 62.0, ((t * 0.7).sin(), (t * 0.9).cos() * 0.5), p.wink)], 0.0, 212.0, 1.0 + 0.07 * k, 0.0, 1.0));
    lid.push(path(s("M -390 436 L 390 436 L 360 456 L -360 456 Z"), s("#0c0e0f"), s(w.accent), 1.5, 0.9));

    fframes::svgr!(
        <g transform={Transform::translate(sway as f64, 0.0)}>
            {back}
            {head_g}
            {lid}
        </g>
    )
}
