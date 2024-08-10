use tauri::{CustomMenuItem, Menu, Submenu};

pub fn create_menu_bar() -> Menu {
    let file_new_file = 
        CustomMenuItem::new(("newFile").to_string(), "New file".to_string())
        .accelerator("CmdOrCtrl+n");

    let file_open_design = 
        CustomMenuItem::new(("openDesign").to_string(), "Open design".to_string())
        .accelerator("CmdOrCtrl+o");
    let file_open_simulation = 
        CustomMenuItem::new(("openSimulation").to_string(), "Open simulation".to_string());
    let file_save = 
        CustomMenuItem::new(("saveFile").to_string(), "Save".to_string())
        .accelerator("CmdOrCtrl+s");
    let file_save_as = 
        CustomMenuItem::new(("saveFileAs").to_string(), "Save as".to_string())
        .accelerator("CmdOrCtrl+Shift+s");

    let file = Submenu::new(("File").to_string(),
        Menu::new()
            .add_item(file_new_file)
            .add_item(file_open_design)
            .add_item(file_open_simulation)
            .add_item(file_save)
            .add_item(file_save_as)
    );

    Menu::new()
        .add_submenu(file)
}