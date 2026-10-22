use crate::song::*;
use crate::theme::*;
use crate::util::*;

pub const LYRICS: [(f32, &str); 11] = [
    (2.46, "You"),
    (2.60, "need"),
    (2.74, "to"),
    (2.84, "move"),
    (3.15, "faster"),
    (3.57, "than"),
    (3.70, "that,"),
    (3.88, "amigo."),
    (4.55, "SPEED"),
    (4.82, "IS"),
    (5.02, "LIFE."),
];
pub const W_AMIGO: f32 = LYRICS[7].0;
pub const W_PUNCH: f32 = LYRICS[8].0;

pub const T_BUILD: f32 = 6.13;
pub const T_CHAPTER2: f32 = 8.68;
pub const VOICE_2: [f32; 9] = [10.73, 10.94, 11.06, 11.15, 11.28, 11.53, 11.68, 11.85, 12.01];
pub const T_ROLL: f32 = 12.69;
pub const T_CHAPTER3: f32 = 14.23;
pub const CALLS: [f32; 3] = [17.50, 17.80, 18.10];
pub const T_THROUGH: f32 = 18.45;
pub const T_DROP1: f32 = 18.89;
pub const T_BREAK: f32 = 29.67;
pub const STABS: [f32; 3] = [30.211, 30.501, 30.905];
pub const T_RESUME: f32 = 31.22;
pub const T_GAP: f32 = 41.98;
pub const LAUGH: [f32; 12] = [41.57, 41.96, 42.34, 42.52, 42.62, 42.73, 42.91, 43.06, 43.16, 43.26, 43.37, 43.46];
pub const T_DROP2: f32 = 43.53;
pub const T_FINALE: f32 = 50.84;
pub const CHOPS: [f32; 4] = [50.88, 51.65, 52.77, 53.18];
pub const T_OUTRO: f32 = 54.30;
pub const T_RECEIPT: f32 = 55.83;
pub const T_END_CARD: f32 = 58.55;
pub const T_END: f32 = 60.6;

#[derive(Clone, Copy, PartialEq)]
pub enum Act {
    Intro,
    Build,
    Drop,
    Break,
    Gap,
    Finale,
    Outro,
}

pub fn act_at(t: f32) -> Act {
    if t < T_BUILD {
        Act::Intro
    } else if t < T_DROP1 {
        Act::Build
    } else if t < T_BREAK {
        Act::Drop
    } else if t < T_RESUME {
        Act::Break
    } else if t < T_GAP {
        Act::Drop
    } else if t < T_DROP2 {
        Act::Gap
    } else if t < T_FINALE {
        Act::Drop
    } else if t < T_OUTRO {
        Act::Finale
    } else {
        Act::Outro
    }
}

pub fn world_at(t: f32) -> usize {
    match act_at(t) {
        Act::Intro => last_before(&LYRICS.map(|(a, _)| a), t).filter(|(i, _)| *i >= 8).map(|(i, _)| STROBE[i % 6]).unwrap_or(VIOLET),
        Act::Build => last_before(&CALLS, t).map(|(i, _)| STROBE[i]).unwrap_or(VIOLET),
        Act::Drop | Act::Break | Act::Gap => last_before(DOWNBEATS, t).map(|(i, _)| STROBE[i % 6]).unwrap_or(NEON),
        Act::Finale => last_before(BEATS, t).map(|(i, _)| STROBE[i % 6]).unwrap_or(NEON),
        Act::Outro => NEON,
    }
}

pub fn kick_pulse(t: f32) -> f32 {
    match last_before(KICKS, t) {
        Some((i, at)) => KICK_POW[i] * (1.0 - (t - at) / 0.16).max(0.0).powi(2),
        None => 0.0,
    }
}

pub fn boom(t: f32) -> f32 {
    pulse(HITS, t, 0.22)
}

pub fn low(t: f32) -> f32 {
    let x = (t * 30.0).max(0.0);
    let i = (x.floor() as usize).min(LOW30.len() - 1);
    let j = (i + 1).min(LOW30.len() - 1);
    lerp(LOW30[i] as f32, LOW30[j] as f32, x.fract()) / 255.0
}

pub fn beat_pulse(t: f32) -> f32 {
    pulse(BEATS, t, 0.30)
}

pub fn hit(t: f32, at: f32, len: f32) -> f32 {
    if t < at { 0.0 } else { (1.0 - (t - at) / len).max(0.0) }
}

pub const SECTION_HITS: [f32; 7] = [T_BUILD, T_CHAPTER2, T_DROP1, T_RESUME, T_DROP2, T_FINALE, T_OUTRO];

pub fn flash(t: f32) -> f32 {
    let mut f = 0.0_f32;
    for at in SECTION_HITS {
        f = f.max(hit(t, at, 0.2));
    }
    for (i, at) in CALLS.iter().enumerate() {
        f = f.max(hit(t, *at, 0.1) * (0.4 + 0.1 * i as f32));
    }
    for (i, at) in STABS.iter().enumerate() {
        f = f.max(hit(t, *at, 0.08) * (0.45 + 0.1 * i as f32));
    }
    if t < T_DROP1 {
        f = f.max(clamp01((t - T_THROUGH) / (T_DROP1 - T_THROUGH)).powi(2) * 0.85);
    }
    f
}

pub fn drop_windows() -> [(f32, f32); 3] {
    [(T_DROP1, T_BREAK), (T_RESUME, T_GAP), (T_DROP2, T_FINALE)]
}

pub fn shot_starts() -> Vec<f32> {
    let mut v = Vec::new();
    for (a, b) in drop_windows() {
        v.push(a);
        v.extend(DOWNBEATS.iter().copied().filter(|d| *d > a + 0.3 && *d < b - 0.3));
    }
    v
}

pub struct Shot {
    pub index: usize,
    pub from: f32,
    pub to: f32,
}

pub fn shot_at(starts: &[f32], t: f32) -> Option<Shot> {
    if act_at(t) != Act::Drop {
        return None;
    }
    let (index, from) = last_before(starts, t)?;
    let window_end = drop_windows().iter().find(|(a, b)| t >= *a && t < *b).map(|(_, b)| *b).unwrap_or(T_END);
    let to = starts.get(index + 1).copied().filter(|n| *n <= window_end).unwrap_or(window_end);
    Some(Shot { index, from, to })
}

pub const EXIT: f32 = 0.12;

pub fn next_cut(starts: &[f32], t: f32) -> Option<(usize, f32)> {
    let i = starts.partition_point(|x| *x <= t);
    let next = *starts.get(i)?;
    let dt = next - t;
    (dt < EXIT && act_at(t) == Act::Drop && act_at(next) == Act::Drop).then_some((i, dt))
}
