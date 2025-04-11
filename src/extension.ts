import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let phpComponentServerDisposable: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('PHP Component Framework extension is now active');

    // Registra o comando para ativar/desativar manualmente o modo component
    const toggleCommand = vscode.commands.registerCommand('php-component.toggleComponentMode', () => {
        vscode.window.showInformationMessage('PHP Component mode toggled');
        // Lógica para ativar/desativar
    });

    context.subscriptions.push(toggleCommand);

    // Detecta quando um workspace é aberto e verifica o arquivo de configuração
    vscode.workspace.onDidChangeWorkspaceFolders(detectConfigurationFile);
    
    // Também verifica ao iniciar
    if (vscode.workspace.workspaceFolders) {
        detectConfigurationFile();
    }

    // Registra o decorationType para destacar a sintaxe especial
    const componentDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(100, 100, 255, 0.1)',
        border: '1px solid rgba(100, 100, 255, 0.3)'
    });

    // Observa alterações no editor
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && isPhpFile(editor.document)) {
            updateDecorations(editor, componentDecorationType);
        }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && isPhpFile(event.document)) {
            updateDecorations(editor, componentDecorationType);
        }
    });

    // Aplicar decorações ao iniciar
    if (vscode.window.activeTextEditor && isPhpFile(vscode.window.activeTextEditor.document)) {
        updateDecorations(vscode.window.activeTextEditor, componentDecorationType);
    }
}

function isPhpFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'php';
}

function detectConfigurationFile() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const configPath = path.join(workspaceRoot, 'php-component.config.json'); // Nome do seu arquivo de configuração

    fs.access(configPath, fs.constants.F_OK, (err) => {
        if (!err) {
            // O arquivo de configuração existe
            fs.readFile(configPath, 'utf8', (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage('Erro ao ler o arquivo de configuração do PHP Component Framework');
                    return;
                }

                try {
                    const config = JSON.parse(data);
                    activatePhpComponentServer(config);
                    vscode.window.showInformationMessage('PHP Component Framework detectado e ativado');
                } catch (e) {
                    vscode.window.showErrorMessage('Arquivo de configuração do PHP Component Framework inválido');
                }
            });
        } else {
            // O arquivo não existe, desativar se estiver ativo
            deactivatePhpComponentServer();
        }
    });
}

function activatePhpComponentServer(config: any) {
    // Se já estiver ativo, desative primeiro
    deactivatePhpComponentServer();

    // Aqui você implementaria a lógica para iniciar seu language server
    // Este é um exemplo simplificado
    
    // Registrar provedores de linguagem específicos para seu componente PHP
    const documentSelector = [
        { scheme: 'file', language: 'php' }
    ];

    // Provedor de completions customizadas
    const completionProvider = vscode.languages.registerCompletionItemProvider(documentSelector, {
        provideCompletionItems(document, position) {
            // Lógica para fornecer sugestões de código baseadas no seu framework
            const completionItems: vscode.CompletionItem[] = [];
            
            // Exemplo de sugestão para um componente personalizado
            const componentCompletion = new vscode.CompletionItem('component', vscode.CompletionItemKind.Snippet);
            componentCompletion.insertText = new vscode.SnippetString('<?component ${1:name}>\n\t${2}\n<?/component>');
            componentCompletion.documentation = new vscode.MarkdownString('Cria um novo componente PHP');
            
            completionItems.push(componentCompletion);
            
            return completionItems;
        }
    });

    // Provedor de hover para mostrar informações sobre componentes
    const hoverProvider = vscode.languages.registerHoverProvider(documentSelector, {
        provideHover(document, position) {
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            
            const word = document.getText(wordRange);
            
            // Verifica se é uma sintaxe específica do seu framework
            const line = document.lineAt(position.line).text;
            if (line.includes('<?component') && word === 'component') {
                return new vscode.Hover('Define um componente PHP reutilizável');
            }
            
            return null;
        }
    });
    
    phpComponentServerDisposable = vscode.Disposable.from(
        completionProvider,
        hoverProvider
    );
}

function deactivatePhpComponentServer() {
    if (phpComponentServerDisposable) {
        phpComponentServerDisposable.dispose();
        phpComponentServerDisposable = undefined;
    }
}

// Função para destacar sintaxe especial
function updateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
    const document = editor.document;
    const text = document.getText();
    
    const componentMatches: vscode.DecorationOptions[] = [];
    
    // Regex para encontrar suas expressões de componente personalizadas
    // Ajuste conforme a sintaxe do seu framework
    const componentRegex = /(<\?component\s+[\w\s\d="']+\?>)|(<\?component\s+[\w\d]+>[\s\S]*?<\?\/component>)/g;
    
    let match;
    while ((match = componentRegex.exec(text))) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        
        const decoration = { 
            range: new vscode.Range(startPos, endPos),
            hoverMessage: 'Componente PHP'
        };
        
        componentMatches.push(decoration);
    }
    
    editor.setDecorations(decorationType, componentMatches);
}

export function deactivate() {
    deactivatePhpComponentServer();
}