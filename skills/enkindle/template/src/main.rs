use fframes::cli::{self, Cli, clap};
use fframes::{EncoderOptions, RenderOptions, Video};
use fframes_skia_renderer::{SkiaFFramesRenderer, SkiaPipelineConcurrencyPolicy, SkiaPipelineConfig, metal::SkiaMetalCtx};
use hype_edit::{Edit, EditMedia};
use std::process::ExitCode;

#[derive(Debug, clap::Args)]
struct VideoArgs {
    #[arg(long, global = true)]
    portrait: bool,
}

fn main() -> ExitCode {
    let args = cli::parse::<VideoArgs>();
    let media = EditMedia::new().expect("media");
    if args.app.portrait { run(&Edit::<true>::new(&media), &media, args) } else { run(&Edit::<false>::new(&media), &media, args) }
}

fn run<const TALL: bool>(video: &Edit<'_, TALL>, media: &EditMedia, args: Cli<VideoArgs>) -> ExitCode {
    let gpu = SkiaMetalCtx::new(<Edit<'static, TALL> as Video>::WIDTH, <Edit<'static, TALL> as Video>::HEIGHT).expect("GPU context");
    cli::new(
        video,
        RenderOptions {
            media: Some(media),
            video_encoder_options: EncoderOptions {
                preferred_encoder: Some("libx264"),
                codec_params: Some(&[("crf", "19"), ("preset", "medium"), ("tune", "animation")]),
                ..Default::default()
            },
            ..Default::default()
        },
    )
    .args(args)
    .backend(
        SkiaFFramesRenderer::new_metal(&gpu, SkiaPipelineConfig { concurrency_policy: SkiaPipelineConcurrencyPolicy::MaxPerformance, ..Default::default() })
            .expect("skia renderer"),
    )
    .preview(fframes_native_player::cli_preview)
    .run()
}
