use crate::startup::SplashStatus::{Progress, Status};
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::ops::Deref;
use std::pin::Pin;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, EventTarget, Manager};
use tokio::time::{sleep, Duration};

#[derive(Clone, Serialize, Deserialize)]
pub enum SplashStatus {
    Progress(f32),
    Status(String),
}

pub struct StartupState {
    backend_ready: bool,
    frontend_ready: bool,
}

#[tauri::command]
pub async fn startup_frontend_ready(app: AppHandle) {
    {
        let startup_state = app.state::<Mutex<StartupState>>();
        let mut startup_state_lock = startup_state.lock().unwrap();
        startup_state_lock.frontend_ready = true;
    }

    update_splashscreen(app.clone(), None);
}

pub fn update_splashscreen(app: AppHandle, status: Option<SplashStatus>) {
    let window = app.get_webview_window("splashscreen");
    if window.is_none() {
        return;
    }

    let startup_state = app.state::<Mutex<StartupState>>();
    let startup_state_lock = startup_state.lock().unwrap();

    if startup_state_lock.is_ready() {
        window.unwrap().close().unwrap();
        app.get_webview_window("main").unwrap().show().unwrap();
    } else {
        app.emit_to(
            EventTarget::WebviewWindow {
                label: "splashscreen".to_owned(),
            },
            "splashscreenUpdate",
            status.clone(),
        )
        .unwrap();
    }
}

async fn load_simulation_models(app: AppHandle) -> Result<(), String> {
    update_splashscreen(
        app.clone(),
        Some(Status("Loading simulation models".to_string())),
    );
    //sleep(Duration::from_secs(1)).await;
    Ok(())
}

async fn analyze_system(app: AppHandle) -> Result<(), String> {
    update_splashscreen(app.clone(), Some(Status("Analyzing system".to_string())));
    //sleep(Duration::from_secs(1)).await;
    Ok(())
}

type BoxFuture = Pin<Box<dyn Future<Output = Result<(), String>> + Send>>;

pub async fn backend_startup(app: AppHandle) -> Result<(), String> {
    let startup_tasks: Vec<BoxFuture> = vec![
        Box::pin(load_simulation_models(app.clone())),
        Box::pin(analyze_system(app.clone())),
    ];
    let total_tasks = startup_tasks.iter().count();

    for (i, startup_func) in startup_tasks.into_iter().enumerate() {
        let progress = (i as f32 / total_tasks as f32) * 100.0;
        update_splashscreen(app.clone(), Some(Progress(progress)));
        startup_func.await?;
    }

    {
        let startup_state = app.state::<Mutex<StartupState>>();
        let mut startup_state_lock = startup_state.lock().unwrap();
        startup_state_lock.backend_ready = true;
    }

    update_splashscreen(
        app.clone(),
        Some(Status("Drawing the frontend".to_string())),
    );
    update_splashscreen(app.clone(), Some(Progress(95.0)));
    Ok(())
}

impl StartupState {
    pub fn new() -> StartupState {
        StartupState {
            backend_ready: false,
            frontend_ready: false,
        }
    }

    pub fn is_ready(&self) -> bool {
        self.frontend_ready && self.backend_ready
    }
}
