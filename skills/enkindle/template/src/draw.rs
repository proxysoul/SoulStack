use fframes::{Svgr, Transform};

pub const HEAD: &str = "Instrument Sans";
pub const MONO: &str = "Geist Mono";
pub const UI: &str = "Geist";
pub const BODY: &str = "DM Sans";

pub fn s(x: &str) -> String {
    x.to_string()
}

pub fn rect(x: f32, y: f32, w: f32, h: f32, rx: f32, fill: String, op: f32) -> Svgr<'static> {
    fframes::svgr!(<rect x={x} y={y} width={w.max(0.5)} height={h.max(0.5)} rx={rx} fill={fill} opacity={op} />)
}

pub fn frame(x: f32, y: f32, w: f32, h: f32, rx: f32, stroke: String, sw: f32, op: f32) -> Svgr<'static> {
    fframes::svgr!(<rect x={x} y={y} width={w.max(0.5)} height={h.max(0.5)} rx={rx} fill="none" stroke={stroke} stroke-width={sw} opacity={op} />)
}

pub fn dot(x: f32, y: f32, r: f32, fill: String, op: f32) -> Svgr<'static> {
    fframes::svgr!(<circle cx={x} cy={y} r={r.max(0.3)} fill={fill} opacity={op} />)
}

pub fn ring(x: f32, y: f32, r: f32, stroke: String, sw: f32, op: f32) -> Svgr<'static> {
    fframes::svgr!(<circle cx={x} cy={y} r={r.max(0.3)} fill="none" stroke={stroke} stroke-width={sw} opacity={op} />)
}

pub fn line(x1: f32, y1: f32, x2: f32, y2: f32, stroke: String, sw: f32, op: f32) -> Svgr<'static> {
    fframes::svgr!(<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} stroke-width={sw} stroke-linecap="round" opacity={op} />)
}

pub fn path(d: String, fill: String, stroke: String, sw: f32, op: f32) -> Svgr<'static> {
    fframes::svgr!(<path d={d} fill={fill} stroke={stroke} stroke-width={sw} stroke-linecap="round" stroke-linejoin="round" opacity={op} />)
}

pub fn text(x: f32, y: f32, size: f32, font: &'static str, fill: String, anchor: &'static str, body: String, op: f32) -> Svgr<'static> {
    let weight = if font == BODY { "500" } else if font == UI { "600" } else { "700" };
    fframes::svgr!(<text x={x} y={y} font-family={font} font-size={size} font-weight={weight} fill={fill} text-anchor={anchor} opacity={op}>{body}</text>)
}

pub fn group(children: Vec<Svgr<'static>>) -> Svgr<'static> {
    fframes::svgr!(<g>{children}</g>)
}

pub fn place(children: Vec<Svgr<'static>>, x: f32, y: f32, scale: f32, rot: f32, op: f32) -> Svgr<'static> {
    fframes::svgr!(
        <g opacity={op} transform={Transform { translate_x: x as f64, translate_y: y as f64, rotate: rot.into(), scale: fframes::Scale::from((scale as f64, scale as f64)), ..Default::default() }}>
            {children}
        </g>
    )
}

pub fn place_xy(children: Vec<Svgr<'static>>, x: f32, y: f32, sx: f32, sy: f32, rot: f32, skew: f32, op: f32) -> Svgr<'static> {
    fframes::svgr!(
        <g opacity={op} transform={Transform { translate_x: x as f64, translate_y: y as f64, rotate: rot.into(), scale: fframes::Scale::from((sx as f64, sy as f64)), skew_x: skew as f64, ..Default::default() }}>
            {children}
        </g>
    )
}
