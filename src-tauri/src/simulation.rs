use std::fs::File;

use qca_core::{
    design::file::QCADesign,
    simulation::{
        file::write_to_file, icha::ICHAModel, model::SimulationModelTrait, run_simulation_async,
        settings::OptionsList, SimulationProgress,
    },
};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Serialize)]
pub struct SimulationModelDescriptor {
    model_id: String,
    model_name: String,
    model_option_list: OptionsList,
    model_settings: String,
    clock_generator_option_list: OptionsList,
    clock_generator_settings: String,
}

fn get_available_sim_models() -> Vec<Box<dyn SimulationModelTrait>> {
    vec![
        //Box::new(BistableModel::new()),
        Box::new(ICHAModel::new()),
    ]
}

#[tauri::command]
pub fn get_sim_models() -> Vec<SimulationModelDescriptor> {
    get_available_sim_models()
        .iter()
        .map(|model| SimulationModelDescriptor {
            model_id: model.get_unique_id(),
            model_name: model.get_name(),
            model_option_list: model.get_model_options_list(),
            model_settings: model.serialize_model_settings().unwrap(),
            clock_generator_option_list: model.get_clock_generator_options_list(),
            clock_generator_settings: model.serialize_clock_generator_settings().unwrap(),
        })
        .collect()
}

pub fn create_sim_model(sim_model_id: String) -> Option<Box<dyn SimulationModelTrait>> {
    let models = get_available_sim_models();
    for model in models {
        if model.get_unique_id() == sim_model_id {
            return Some(model);
        }
    }
    None
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
            let _ = write_to_file(file, &qca_design, &simulation_data);
            Ok("".into())
        }
        None => Err("No model with such id exists".into()),
    }
}
