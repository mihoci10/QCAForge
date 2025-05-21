use std::future::Future;
use std::ops::Deref;
use std::pin::Pin;
use std::sync::Mutex;
use tokio::time::{sleep, Duration};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, EventTarget, Manager};
use crate::startup::SplashStatus::{Progress, Status};

#[derive(Clone, Serialize, Deserialize)]
pub enum SplashStatus {
    Progress(f32),
    Status(String),
    Done,
}

pub struct StartupState{
    backend_ready: bool,
    frontend_ready: bool,
}

pub fn update_splashscreen(app: AppHandle, status: SplashStatus) {
    let window = app.get_webview_window("splashscreen").unwrap();

    app.emit_to(EventTarget::WebviewWindow { label: "splashscreen".to_owned() }, "splashscreenUpdate", status.clone()).unwrap();

    let startup_state = app.state::<Mutex<StartupState>>();
    let startup_state_lock = startup_state.lock().unwrap();

    if startup_state_lock.is_ready() {
        window.close().unwrap();
        app.get_webview_window("main").unwrap().show().unwrap();
    }
}

async fn load_simulation_models(app: AppHandle) -> Result<(), String> {
    update_splashscreen(app.clone(), Status("Loading simulation models".to_string()));
    Ok(())
}

async fn analyze_system(app: AppHandle) -> Result<(), String> {
    update_splashscreen(app.clone(), Status("Analyzing system".to_string()));
    Ok(())
}

type BoxFuture = Pin<Box<dyn Future<Output = Result<(), String>> + Send>>;

pub async fn backend_startup(app: AppHandle, ) -> Result<(), String> {
    let startup_tasks: Vec<BoxFuture>  = vec![
        Box::pin(load_simulation_models(app.clone())),
        Box::pin(analyze_system(app.clone())),
    ];
    let total_tasks = startup_tasks.iter().count();

    for (i, startup_func) in startup_tasks.into_iter().enumerate() {
        let progress = (i as f32 / total_tasks as f32) * 100.0;
        update_splashscreen(app.clone(), Progress(progress));
        startup_func.await?;
    }

    let  startup_state = app.state::<Mutex<StartupState>>();
    let mut startup_state_lock = startup_state.lock().unwrap();
    startup_state_lock.backend_ready = true;
    startup_state_lock.frontend_ready = true;

    update_splashscreen(app.clone(), SplashStatus::Done);
    Ok(())
}

impl StartupState{
    pub fn new() -> StartupState{
        StartupState {backend_ready: false, frontend_ready: false}
    }

    pub fn is_ready(&self) -> bool {
        self.frontend_ready && self.backend_ready
    }
}