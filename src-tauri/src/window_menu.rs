use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    App, Wry,
};

pub fn create_menu_bar(app: &mut App) -> Menu<Wry> {
    let file_new_design = MenuItemBuilder::new("New file")
        .id("newFile")
        .accelerator("CmdOrCtrl+N")
        .build(app)
        .unwrap();
    let file_open_design = MenuItemBuilder::new("Open design")
        .id("openDesign")
        .accelerator("CmdOrCtrl+O")
        .build(app)
        .unwrap();
    let file_open_simulation = MenuItemBuilder::new("Open simulation")
        .id("openSimulation")
        .build(app)
        .unwrap();
    let file_save_file = MenuItemBuilder::new("Save")
        .id("saveFile")
        .accelerator("CmdOrCtrl+S")
        .build(app)
        .unwrap();
    let file_save_file_as = MenuItemBuilder::new("Save as")
        .id("saveFileAs")
        .accelerator("CmdOrCtrl+Shift+S")
        .build(app)
        .unwrap();

    let file_menu = SubmenuBuilder::new(app, "File")
        .items(&[
            &file_new_design,
            &file_open_design,
            &file_open_simulation,
            &file_save_file,
            &file_save_file_as,
        ])
        .build()
        .unwrap();

    MenuBuilder::new(app).items(&[&file_menu]).build().unwrap()
}
