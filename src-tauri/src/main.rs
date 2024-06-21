// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write};

use qca_core::sim::{bistable::BistableModel, run_simulation, settings::OptionsList, QCACell, SimulationModelTrait};
use serde::Serialize;
use tauri::Manager;
use window_shadows::set_shadow;

fn create_sim_model(sim_model_id: String) -> Option<Box<dyn SimulationModelTrait>>{
  match sim_model_id.as_str() {
   "bistable_model" => Some(Box::new(BistableModel::new())),
    _ => None,
  }
}

#[derive(Serialize)]
struct SimulationModelDescriptor {
  model_id: String,
  model_name: String,
  model_option_list: OptionsList,
  model_settings: String
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_context_menu::init())
    .setup(|app| {
      set_shadow(&app.get_window("main").unwrap(), true).unwrap();
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_sim_version, get_sim_models, get_sim_model_options_list, run_sim_model, get_sim_model_default_options
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn get_sim_version() -> String {
  qca_core::QCA_CORE_VERSION.to_string()
}

#[tauri::command]
fn get_sim_models() -> Vec<SimulationModelDescriptor> {
  let model_list: Vec<Box<dyn SimulationModelTrait>> = vec![Box::new(BistableModel::new())];
  model_list.iter().map(|model| {
    SimulationModelDescriptor{
      model_id: model.get_unique_id(),
      model_name: model.get_name(),
      model_option_list: model.get_options_list(),
      model_settings: model.get_deserialized_settings().unwrap()
    }
  }).collect()
}

#[tauri::command]
fn get_sim_model_options_list(sim_model_id: String) -> Result<OptionsList, String> {
  match create_sim_model(sim_model_id){
    Some(model) => 
      Ok(model.get_options_list()),
    None => Err("No model with such id exists".into()),
  }
}

#[tauri::command]
fn get_sim_model_default_options(sim_model_id: String) -> Result<String, String> {
  match create_sim_model(sim_model_id){
    Some(model) => 
      model.get_deserialized_settings(),
    None => Err("No model with such id exists".into()),
  }
}

#[tauri::command]
fn run_sim_model(sim_model_id: String, cells: String, sim_model_settings: String) -> Result<String, String> {  
  let cells_obj: Result<Vec<QCACell>, serde_json::Error> = serde_json::from_str(&cells);
  
  match &mut create_sim_model(sim_model_id) {
    Some(model) => {
      match cells_obj{
          Ok(cells) => {
            match model.set_serialized_settings(&sim_model_settings){
                Ok(()) => {
                  let file = Box::new(File::create("output.bin").unwrap()) as Box<dyn Write>;
                  run_simulation(model, cells, Some(file));
                  Ok("".into())
                },
                Err(err) => Err(format!("Parsing settings error: {}", err.to_string())),
            }
          },
          Err(err) => Err(format!("Parsing cells error: {}", err.to_string())),
      }
    },
    None => Err("No model with such id exists".into()),
  }
}