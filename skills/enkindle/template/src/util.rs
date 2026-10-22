pub fn clamp01(x: f32) -> f32 {
    x.clamp(0.0, 1.0)
}

pub fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

pub fn ease_out(t: f32) -> f32 {
    1.0 - (1.0 - clamp01(t)).powi(3)
}

pub fn ease_in(t: f32) -> f32 {
    clamp01(t).powi(3)
}

pub fn ease_in_out(t: f32) -> f32 {
    let t = clamp01(t);
    if t < 0.5 { 4.0 * t * t * t } else { 1.0 - (-2.0 * t + 2.0).powi(3) / 2.0 }
}

pub fn back_out(t: f32) -> f32 {
    let t = clamp01(t);
    let c1 = 2.2;
    let c3 = c1 + 1.0;
    1.0 + c3 * (t - 1.0).powi(3) + c1 * (t - 1.0).powi(2)
}

pub fn spring(t: f32) -> f32 {
    if t <= 0.0 {
        return 0.0;
    }
    1.0 - (-t * 9.0).exp() * (t * 26.0).cos()
}

pub fn hash(n: f32) -> f32 {
    let x = (n * 127.1 + 311.7).sin() * 43758.547;
    x - x.floor()
}

pub fn last_before(list: &[f32], t: f32) -> Option<(usize, f32)> {
    let i = list.partition_point(|&x| x <= t);
    if i == 0 { None } else { Some((i - 1, list[i - 1])) }
}

pub fn pulse(list: &[f32], t: f32, decay: f32) -> f32 {
    match last_before(list, t) {
        Some((_, at)) => (1.0 - (t - at) / decay).max(0.0).powi(2),
        None => 0.0,
    }
}

pub fn window(t: f32, a: f32, b: f32, fin: f32, fout: f32) -> f32 {
    if t < a || t > b {
        return 0.0;
    }
    ease_out((t - a) / fin).min(ease_out((b - t) / fout))
}

pub fn rgb(hex: &str) -> [f32; 3] {
    let v = u32::from_str_radix(hex.trim_start_matches('#'), 16).unwrap_or(0);
    [((v >> 16) & 255) as f32 / 255.0, ((v >> 8) & 255) as f32 / 255.0, (v & 255) as f32 / 255.0]
}

pub fn alpha(hex: &str, a: f32) -> String {
    format!("{}{:02x}", hex, (clamp01(a) * 255.0) as u8)
}

pub fn commas(n: u32) -> String {
    let digits = n.to_string();
    let mut out = String::new();
    for (i, ch) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

pub fn clip(body: &str, max: usize) -> String {
    if body.chars().count() <= max {
        return body.to_string();
    }
    let cut: String = body.chars().take(max.saturating_sub(1)).collect();
    format!("{}…", cut.trim_end_matches([' ', ',', ':', '—']))
}
