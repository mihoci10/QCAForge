use std::{collections::HashMap, fs::File, io::Write};

use qca_core::sim::{architecture::QCACellArchitecture, full_basis::FullBasisModel, layer::QCALayer, model::SimulationModelTrait, run_simulation_async, SimulationProgress};
use tauri::{AppHandle, Emitter};

pub fn create_sim_model(sim_model_id: String) -> Option<Box<dyn SimulationModelTrait>> {
    match sim_model_id.as_str() {
        //"bistable_model" => Some(Box::new(BistableModel::new())),
        "full_basis_model" => Some(Box::new(FullBasisModel::new())),
        _ => None,
    }
}

#[tauri::command(async)]
pub fn run_sim_model(
    app: AppHandle,
    sim_model_id: String,
    layers: String,
    architectures: String,
    sim_model_settings: String,
) -> Result<String, String> {
    let layers_obj: Result<Vec<QCALayer>, serde_json::Error> = serde_json::from_str(&layers);
    let architectures_map = serde_json::from_str::<HashMap<String, QCACellArchitecture>>(&architectures).unwrap();
    
    match create_sim_model(sim_model_id) {
        Some(mut model) => match layers_obj {
            Ok(layers) => match model.set_serialized_settings(&sim_model_settings) {
                Ok(()) => {
                    let file = Box::new(File::create("output.qcs").unwrap()) as Box<dyn Write + Send>;

                    let (_, progress_rx, _) = 
                        run_simulation_async(model, layers, architectures_map, Some(file));

                    for progress in progress_rx {
                        match progress {
                            SimulationProgress::Running{current_sample, total_samples} => {
                                let percent = (current_sample as f32 / total_samples as f32) * 100.0;
                                app.emit("simulationProgress", percent).unwrap();
                            },
                            _ => {}
                        }
                    }
                    Ok("".into())
                }
                Err(err) => Err(format!("Parsing settings error: {}", err.to_string())),
            },
            Err(err) => Err(format!("Parsing cells error: {}", err.to_string())),
        },
        None => Err("No model with such id exists".into()),
    }
}