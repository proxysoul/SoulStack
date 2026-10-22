use std::sync::OnceLock;

static TALL: OnceLock<bool> = OnceLock::new();

pub fn init(tall: bool) {
    let set = *TALL.get_or_init(|| tall);
    assert_eq!(set, tall, "the layout is already set to the other orientation");
}

pub fn tall() -> bool {
    TALL.get().copied().unwrap_or(false)
}

pub fn vw() -> f32 {
    if tall() { 1080.0 } else { 1920.0 }
}

pub fn vh() -> f32 {
    if tall() { 1920.0 } else { 1080.0 }
}

pub fn mx() -> f32 {
    vw() / 2.0
}

pub fn my() -> f32 {
    vh() / 2.0
}

pub fn pick<T>(wide: T, narrow: T) -> T {
    if tall() { narrow } else { wide }
}

pub fn fit(body: &str, width: f32, max: f32, em: f32) -> f32 {
    (width / (body.chars().count().max(1) as f32 * em)).min(max)
}

pub fn wrap(body: &str, max_chars: usize) -> Vec<String> {
    let n = body.chars().count();
    if n <= max_chars {
        return vec![body.to_string()];
    }
    let mid = n as f32 / 2.0;
    let split = body.char_indices().filter(|(_, c)| *c == ' ').map(|(i, _)| i).min_by(|a, b| (*a as f32 - mid).abs().total_cmp(&(*b as f32 - mid).abs()));
    match split {
        Some(i) => vec![body[..i].to_string(), body[i + 1..].to_string()],
        None => vec![body.to_string()],
    }
}
