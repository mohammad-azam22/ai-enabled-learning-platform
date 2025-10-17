const editorTheme = 'snow';

function initialize_editor(editor) {
    new Quill(editor, {
        theme: editorTheme
    });
}