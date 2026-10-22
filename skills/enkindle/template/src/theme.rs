pub struct World {
    pub name: &'static str,
    pub backdrop: &'static str,
    pub raised: &'static str,
    pub sunken: &'static str,
    pub ink: &'static str,
    pub soft: &'static str,
    pub rule: &'static str,
    pub accent: &'static str,
    pub alt: &'static str,
    pub spark: &'static str,
}

pub const NEON: usize = 0;
pub const VIOLET: usize = 1;
pub const OCEAN: usize = 2;
pub const CRIMSON: usize = 3;
pub const EMBER: usize = 4;
pub const STEEL: usize = 5;

pub const WORLDS: [World; 6] = [
    World { name: "neon", backdrop: "#060807", raised: "#0e1410", sunken: "#030504", ink: "#f3f7f3", soft: "#9aa89c", rule: "#1e2a22", accent: "#39ff14", alt: "#d89b65", spark: "#eca3c4" },
    World { name: "violet", backdrop: "#0a0812", raised: "#15102a", sunken: "#05040b", ink: "#e9e7f2", soft: "#9a92b4", rule: "#2a2140", accent: "#8b5cf6", alt: "#ff3d7f", spark: "#ff8fb4" },
    World { name: "ocean", backdrop: "#070b10", raised: "#0d1822", sunken: "#03070b", ink: "#e6eef3", soft: "#8ba3b4", rule: "#1a2a38", accent: "#22b8e6", alt: "#1ab8a4", spark: "#f28fb0" },
    World { name: "crimson", backdrop: "#0e0812", raised: "#1c0f1e", sunken: "#07030a", ink: "#f6eaf1", soft: "#b892a6", rule: "#2f1d2e", accent: "#f43f5e", alt: "#ab7bf0", spark: "#ffb3c8" },
    World { name: "ember", backdrop: "#0b0906", raised: "#18110a", sunken: "#050302", ink: "#f0ece4", soft: "#b2a692", rule: "#2b2014", accent: "#f59e0b", alt: "#d4a35a", spark: "#f0a08a" },
    World { name: "steel", backdrop: "#0c0e11", raised: "#151a20", sunken: "#06080a", ink: "#e8ebee", soft: "#9aabb8", rule: "#222c36", accent: "#94a3b8", alt: "#c49aa4", spark: "#e0a9b6" },
];

pub const STROBE: [usize; 6] = [CRIMSON, OCEAN, EMBER, NEON, STEEL, VIOLET];
