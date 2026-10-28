use std::fs::{self, File};

use qca_core::{
    design::file::QCADesign,
    simulation::{
        file::write_to_file,
        models::{available_models, prepare_simulation},
        run_simulation_async,
        settings::OptionsList,
        SimulationProgress,
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

#[tauri::command]
pub fn get_sim_models() -> Vec<SimulationModelDescriptor> {
    available_models()
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

#[tauri::command(async)]
pub fn run_sim_model(
    app: AppHandle,
    qca_design: QCADesign,
    result_filename: String,
) -> Result<String, String> {
    let (model, custom_input_sequence) = prepare_simulation(&qca_design)?;
    let layers = qca_design.layers.clone();
    let architectures = qca_design.cell_architectures.clone();

    let (sim_handle, progress_rx, _) =
        run_simulation_async(model, layers, architectures, custom_input_sequence);

    // Report whole-percent steps only; one event per sample floods the webview.
    let mut last_percent = None;
    for progress in progress_rx {
        if let SimulationProgress::Running {
            current_sample,
            total_samples,
        } = progress
        {
            let percent = (current_sample * 100 / total_samples.max(1)) as u32;
            if last_percent != Some(percent) {
                last_percent = Some(percent);
                let _ = app.emit("simulationProgress", percent as f32);
            }
        }
    }

    let simulation_data = sim_handle
        .join()
        .map_err(|_| "The simulation stopped unexpectedly".to_string())?;

    // Write then rename so a failed write keeps any existing result file.
    let partial_filename = format!("{}.part", result_filename);
    let file = File::create(&partial_filename)
        .map_err(|e| format!("Could not create result file: {}", e))?;
    write_to_file(file, &qca_design, &simulation_data).map_err(|e| {
        let _ = fs::remove_file(&partial_filename);
        format!("Could not write result file: {}", e)
    })?;
    fs::rename(&partial_filename, &result_filename)
        .map_err(|e| format!("Could not save result file: {}", e))?;

    Ok(result_filename)
}
