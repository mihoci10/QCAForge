// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{sync::Mutex};

use qca_core::sim::{bistable::BistableModel, settings::OptionsList, settings::OptionsValueList, SimulationModelTrait};
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
      get_sim_models, get_sim_model_options_list, set_sim_model_options, get_sim_model_options
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

#[tauri::command]
fn set_sim_model_options(sim_model_id: String, sim_model_options: String, state: State<SimulationModels>) -> Result<(), String> {
  let mut model_binding = state.model_list.lock().unwrap();
  let model = model_binding.iter_mut()
    .find(|model| model.get_unique_id() == sim_model_id);

  let options: Result<OptionsValueList, serde_json::Error> = serde_json::from_str(&sim_model_options);
  
  match model {
    Some(model) => {
      match options {
          Ok(options) => {
            model.set_options_value_list(options);
            Ok(())
          },
          Err(err) => Err(format!("Parsing error: {}", err.to_string())),
      }
      },
    None => Err("No model with such id exists".into()),
  }
}

#[tauri::command]
fn get_sim_model_options(sim_model_id: String, state: State<SimulationModels>) -> Result<OptionsValueList, String> {
  let model_binding = state.model_list.lock().unwrap();
  let model = model_binding.iter()
    .find(|model| model.get_unique_id() == sim_model_id);
  
  match model {
    Some(model) => Ok(model.get_options_value_list()),
    None => Err("No model with such id exists".into()),
  }
}