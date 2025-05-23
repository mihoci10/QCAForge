// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::Mutex;
use qca_core::{
    objects::{architecture::QCACellArchitecture, layer::QCALayer},
    simulation::{full_basis::FullBasisModel, model::SimulationModelTrait, settings::OptionsList},
};
use serde::Serialize;
use tauri::http::{header, Response, StatusCode};
use tauri::{Emitter, Manager, Url};
use tauri::async_runtime::spawn;

#[derive(Serialize)]
struct SimulationModelDescriptor {
    model_id: String,
    model_name: String,
    model_option_list: OptionsList,
    model_settings: String,
}

mod window_menu;
use window_menu::create_menu_bar;

mod simulation;
mod analysis;

use simulation::*;
use analysis::*;

mod startup;
use startup::*;

fn main() {
    tauri::Builder::default()
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
            get_sim_version,
            get_sim_models,
            get_sim_model_options_list,
            run_sim_model,
            get_sim_model_default_options,
            load_simulation_file,
            startup_frontend_ready,
        ])
        .register_uri_scheme_protocol("load-sim", |_, req| {
            match handle_load_sim(req) {
                Ok(bin_data) => Response::builder()
                    .status(StatusCode::OK)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET")
                    .header(header::CONTENT_TYPE, mime::APPLICATION_OCTET_STREAM.essence_str())
                    .body(bin_data)
                    .unwrap(),
                Err(error) => Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET")
                    .header(header::CONTENT_TYPE, mime::TEXT_PLAIN.essence_str())
                    .body(error.as_bytes().to_vec())
                    .unwrap()
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_sim_version() -> String {
    qca_core::QCA_CORE_VERSION.to_string()
}

#[tauri::command]
fn get_sim_models() -> Vec<SimulationModelDescriptor> {
    let model_list: Vec<Box<dyn SimulationModelTrait>> = vec![
        //Box::new(BistableModel::new()),
        Box::new(FullBasisModel::new()),
    ];
    model_list
        .iter()
        .map(|model| SimulationModelDescriptor {
            model_id: model.get_unique_id(),
            model_name: model.get_name(),
            model_option_list: model.get_options_list(),
            model_settings: model.get_deserialized_settings().unwrap(),
        })
        .collect()
}

#[tauri::command]
fn get_sim_model_options_list(sim_model_id: String) -> Result<OptionsList, String> {
    match create_sim_model(sim_model_id) {
        Some(model) => Ok(model.get_options_list()),
        None => Err("No model with such id exists".into()),
    }
}

#[tauri::command]
fn get_sim_model_default_options(sim_model_id: String) -> Result<String, String> {
    match create_sim_model(sim_model_id) {
        Some(model) => model.get_deserialized_settings(),
        None => Err("No model with such id exists".into()),
    }
}
