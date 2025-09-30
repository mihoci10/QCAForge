// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use qca_core::{
    objects::{architecture::QCACellArchitecture, layer::QCALayer},
    simulation::{icha::ICHAModel, model::SimulationModelTrait, settings::OptionsList},
};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::async_runtime::spawn;
use tauri::http::{header, Response, StatusCode};
use tauri::{Emitter, Manager, Url};

#[derive(Serialize)]
struct BuildInfo {
    timestamp: String,
    git_sha: String,
    git_branch: String,
    version: String,
    qca_core_version: String,
    debug: bool,
}

mod window_menu;
use window_menu::create_menu_bar;

mod analysis;
mod simulation;

use analysis::*;
use simulation::*;

mod startup;
use startup::*;

mod design;
use design::*;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .on_menu_event(|app, event| {
            let _ = app.emit(event.id().0.as_str(), {});
        })
        .setup(|app| {
            let _ = app
                .handle()
                .get_webview_window("main")
                .unwrap()
                .set_shadow(true);
            let menu = create_menu_bar(app);
            let _ = app.set_menu(menu);
            spawn(backend_startup(app.handle().clone()));
            Ok(())
        })
        .manage(Mutex::new(StartupState::new()))
        .invoke_handler(tauri::generate_handler![
            get_build_info,
            get_sim_version,
            get_sim_models,
            run_sim_model,
            load_design_file,
            save_design_file,
            load_simulation_file,
            calculate_truth_table,
            startup_frontend_ready,
        ])
        .register_uri_scheme_protocol("load-sim", |_, req| match handle_load_sim(req) {
            Ok(bin_data) => Response::builder()
                .status(StatusCode::OK)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET")
                .header(
                    header::CONTENT_TYPE,
                    mime::APPLICATION_OCTET_STREAM.essence_str(),
                )
                .body(bin_data)
                .unwrap(),
            Err(error) => Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET")
                .header(header::CONTENT_TYPE, mime::TEXT_PLAIN.essence_str())
                .body(error.as_bytes().to_vec())
                .unwrap(),
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_sim_version() -> String {
    qca_core::QCA_CORE_VERSION.to_string()
}

#[tauri::command]
fn get_build_info() -> BuildInfo {
    let build_time = env!("VERGEN_BUILD_TIMESTAMP").to_string();
    let git_sha = env!("VERGEN_GIT_SHA").to_string();
    let git_branch = env!("VERGEN_GIT_BRANCH").to_string();
    let version = env!("VERGEN_GIT_DESCRIBE").to_string();
    let debug = env!("VERGEN_CARGO_DEBUG").to_string() == "true";

    BuildInfo {
        timestamp: build_time,
        git_sha,
        git_branch,
        version,
        qca_core_version: qca_core::QCA_CORE_VERSION.to_string(),
        debug,
    }
}
