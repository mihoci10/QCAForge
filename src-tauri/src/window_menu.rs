use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, Submenu, SubmenuBuilder},
    App, Wry,
};

fn create_file_menu(app: &mut App) -> Submenu<Wry> {
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

    SubmenuBuilder::new(app, "File")
        .items(&[
            &file_new_design,
            &PredefinedMenuItem::separator(app).unwrap(),
            &file_open_design,
            &file_open_simulation,
            &PredefinedMenuItem::separator(app).unwrap(),
            &file_save_file,
            &file_save_file_as,
        ])
        .build()
        .unwrap()
}

fn create_edit_menu(app: &mut App) -> Submenu<Wry> {
    let edit_undo = MenuItemBuilder::new("Undo")
        .id("undo")
        .accelerator("CmdOrCtrl+Z")
        .enabled(false)
        .build(app)
        .unwrap();
    let edit_redo = MenuItemBuilder::new("Redo")
        .id("redo")
        .accelerator("CmdOrCtrl+Shift+Z")
        .enabled(false)
        .build(app)
        .unwrap();
    let edit_cut = MenuItemBuilder::new("Cut")
        .id("cut")
        .accelerator("CmdOrCtrl+X")
        .build(app)
        .unwrap();
    let edit_copy = MenuItemBuilder::new("Copy")
        .id("copy")
        .accelerator("CmdOrCtrl+C")
        .build(app)
        .unwrap();
    let edit_paste = MenuItemBuilder::new("Paste")
        .id("paste")
        .accelerator("CmdOrCtrl+V")
        .build(app)
        .unwrap();
    let edit_delete = MenuItemBuilder::new("Delete")
        .id("delete")
        .accelerator("Delete")
        .build(app)
        .unwrap();

    SubmenuBuilder::new(app, "Edit")
        .items(&[
            &edit_undo,
            &edit_redo,
            &PredefinedMenuItem::separator(app).unwrap(),
            &edit_cut,
            &edit_copy,
            &edit_paste,
            &PredefinedMenuItem::separator(app).unwrap(),
            &edit_delete,
        ])
        .build()
        .unwrap()
}

pub fn create_menu_bar(app: &mut App) -> Menu<Wry> {
    let file_menu = create_file_menu(app);
    let edit_menu = create_edit_menu(app);
    MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu])
        .build()
        .unwrap()
}
