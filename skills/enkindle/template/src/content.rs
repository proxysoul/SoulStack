use crate::timeline::*;

pub const PRODUCT: &str = "comet";
pub const TAGLINE: &str = "ship before the coffee cools";
pub const MAKER: &str = "made by @you";
pub const SONG: &str = "song: Speed is Life · via @cowbeans327";
pub const LOGO: &str = "logo.png";

pub const CALL_WORD: &str = "FASTER";
pub const STAB_WORDS: [&str; 3] = ["NO", "BRAKES", "GO"];
pub const LAUGH_WORDS: [&str; 4] = ["ha", "HA", "haha", "HA!"];
pub const CHOP_WORDS: [&str; 4] = ["all of it.", "one person.", "180 days.", "4,800 commits."];

pub struct Chapter {
    pub at: f32,
    pub tag: &'static str,
    pub title: &'static str,
    pub line: &'static str,
    pub img: &'static str,
}

pub const CHAPTERS: [Chapter; 3] = [
    Chapter { at: T_BUILD, tag: "v1", title: "a weekend script", line: "one file, zero tests", img: "v1.png" },
    Chapter { at: T_CHAPTER2, tag: "v2", title: "the rewrite", line: "renamed, rebuilt, ten times faster", img: "v2.png" },
    Chapter { at: T_CHAPTER3, tag: "v3", title: "the real thing", line: "the one people use", img: "v3.png" },
];

pub const MILESTONES: [&str; 12] = ["v0.1.0", "v0.2.0", "v0.4.1", "v0.7.0", "v1.0.0", "v1.2.3", "v1.5.0", "v2.0.0", "v2.3.1", "v2.8.0", "v3.0.0", "v3.1.4"];

pub struct Feature {
    pub glyph: &'static str,
    pub title: &'static str,
    pub line: &'static str,
    pub img: &'static str,
}

pub const FEATURES: [Feature; 16] = [
    Feature { glyph: ">_", title: "one command deploys", line: "push, build, live in 9 s", img: "shot-1.png" },
    Feature { glyph: "</>", title: "preview every branch", line: "a URL per pull request", img: "shot-2.png" },
    Feature { glyph: "{ }", title: "config in code", line: "typed, versioned, diffable", img: "shot-3.png" },
    Feature { glyph: "<->", title: "instant rollbacks", line: "one click back in time", img: "shot-4.png" },
    Feature { glyph: "%", title: "live metrics", line: "p99 on the deploy screen", img: "shot-5.png" },
    Feature { glyph: "#", title: "secrets vault", line: "never in your repo", img: "shot-6.png" },
    Feature { glyph: "++", title: "auto scaling", line: "zero to a million", img: "shot-1.png" },
    Feature { glyph: "=>", title: "edge functions", line: "40 regions, one file", img: "shot-2.png" },
    Feature { glyph: "@", title: "team reviews", line: "approve from your phone", img: "shot-3.png" },
    Feature { glyph: "~", title: "logs that search", line: "grep a week in 80 ms", img: "shot-4.png" },
    Feature { glyph: "*", title: "cron jobs", line: "schedules with retries", img: "shot-5.png" },
    Feature { glyph: "$", title: "cost per request", line: "see every cent", img: "shot-6.png" },
    Feature { glyph: "!", title: "smart alerts", line: "only when it matters", img: "shot-1.png" },
    Feature { glyph: "&", title: "databases", line: "branch your data too", img: "shot-2.png" },
    Feature { glyph: "?", title: "AI incident notes", line: "what broke, in one line", img: "shot-3.png" },
    Feature { glyph: "::", title: "plugins", line: "bring your own steps", img: "shot-4.png" },
];

pub const SCREENS: [&str; 6] = ["shot-1.png", "shot-2.png", "shot-3.png", "shot-4.png", "shot-5.png", "shot-6.png"];

pub struct Stat {
    pub value: u32,
    pub label: &'static str,
}

pub const STATS: [Stat; 4] = [
    Stat { value: 2400, label: "stars" },
    Stat { value: 120, label: "releases" },
    Stat { value: 4800, label: "commits" },
    Stat { value: 180, label: "days" },
];

pub struct Line {
    pub label: &'static str,
    pub dollars: u32,
    pub note: &'static str,
    pub paid: bool,
    pub saved: bool,
}

pub const RECEIPT: [Line; 4] = [
    Line { label: "compute used", dollars: 12_480, note: "at list price", paid: false, saved: false },
    Line { label: "you paid", dollars: 300, note: "", paid: true, saved: false },
    Line { label: "saved by caching", dollars: 96_200, note: "98% cache hit", paid: false, saved: true },
    Line { label: "vs the others", dollars: 9_870, note: "measured, same workload", paid: false, saved: true },
];
