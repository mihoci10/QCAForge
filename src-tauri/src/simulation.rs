use std::{collections::HashMap, fs::File};

use qca_core::{
    design::{self, file::QCADesign},
    objects::{architecture::QCACellArchitecture, layer::QCALayer},
    simulation::{
        file::write_to_file, icha::ICHAModel, model::SimulationModelTrait,
        run_simulation_async, SimulationProgress,
    },
};
use tauri::{AppHandle, Emitter};

pub fn create_sim_model(sim_model_id: String) -> Option<Box<dyn SimulationModelTrait>> {
    match sim_model_id.as_str() {
        //"bistable_model" => Some(Box::new(BistableModel::new())),
        "full_basis_model" => Some(Box::new(ICHAModel::new())),
        _ => None,
    }
}

#[tauri::command(async)]
pub fn run_sim_model(app: AppHandle, qca_design: QCADesign) -> Result<String, String> {
    let sim_model_id = qca_design
        .simulation_settings
        .selected_simulation_model_id
        .clone()
        .unwrap();
    let sim_settings = &qca_design.simulation_settings.simulation_model_settings[&sim_model_id];
    let sim_model_settings = sim_settings.model_settings.clone();
    let clock_generator_settings = sim_settings.clock_generator_settings.clone();
    let layers = qca_design.layers.clone();
    let architectures = qca_design.cell_architectures.clone();

    match create_sim_model(sim_model_id) {
        Some(mut model) => {
            model
                .deserialize_model_settings(&sim_model_settings.to_string())
                .map_err(|e| format!("Error parsing model settings: {}", e))?;
            model
                .deserialize_clock_generator_settings(&clock_generator_settings.to_string())
                .map_err(|e| format!("Error parsing clock generator settings: {}", e))?;

            let file = File::create("output.qcs").unwrap();

            let (sim_handle, progress_rx, _) = run_simulation_async(model, layers, architectures);

            for progress in progress_rx {
                match progress {
                    SimulationProgress::Running {
                        current_sample,
                        total_samples,
                    } => {
                        let percent = (current_sample as f32 / total_samples as f32) * 100.0;
                        app.emit("simulationProgress", percent).unwrap();
                    }
                    _ => {}
                }
            }

            let simulation_data = sim_handle.join().unwrap();
            write_to_file(file, &qca_design, &simulation_data);
            Ok("".into())
        }
        None => Err("No model with such id exists".into()),
    }
}
