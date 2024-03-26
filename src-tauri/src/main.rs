// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use qca_core::sim::{bistable::BistableModel, settings::OptionsList, SimulationModelTrait};
use tauri::{Manager, State};

struct SimulationModels{
  model_list: Mutex<Vec<Box<dyn SimulationModelTrait + Send>>>,
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      app.manage(SimulationModels{model_list: Mutex::new(vec![])});

      let models: State<SimulationModels> = app.state();
      models.model_list.lock().unwrap().push(Box::new(BistableModel::new()));

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      get_sim_models, get_sim_model_options_list
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn get_sim_models(state: State<SimulationModels>) -> String {
  format!("{}{}{}", "[", 
  state.model_list.lock().unwrap().iter().map(|model| {
    format!("\"{}\"", model.get_unique_id())
  }).collect::<Vec<String>>().join(","),
   "]")
}

#[tauri::command]
fn get_sim_model_options_list(sim_model_id: String, state: State<SimulationModels>) -> Result<OptionsList, String> {
  match state.model_list.lock().unwrap().iter()
    .filter(|model| sim_model_id == model.get_unique_id())
    .next() {
      Some(r) => 
        Ok(r.get_options_list()),
      None => 
        Err("No model with such id exists".into())
  }
}