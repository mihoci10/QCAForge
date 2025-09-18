use vergen_gitcl::{BuildBuilder, CargoBuilder, Emitter, GitclBuilder};

fn main() {
    let build = BuildBuilder::default()
        .build_timestamp(true)
        .build()
        .unwrap();
    let gitcl = GitclBuilder::default()
        .branch(true)
        .sha(true)
        .describe(true, false, None)
        .build()
        .unwrap();
    let cargo = CargoBuilder::default().debug(true).build().unwrap();

    Emitter::default()
        .add_instructions(&build)
        .unwrap()
        .add_instructions(&gitcl)
        .unwrap()
        .add_instructions(&cargo)
        .unwrap()
        .emit()
        .unwrap();
    tauri_build::build()
}
