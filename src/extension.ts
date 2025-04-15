import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface ComponentDefinition {
    name: string;
    properties: {
        name: string;
        type: string;
        description?: string;
        required?: boolean;
    }[];
    description?: string;
    filePath?: string;
}

const components: Map<string, ComponentDefinition> = new Map();

export function activate(context: vscode.ExtensionContext) {
    console.log('PHP Component Framework extension is now active');

    // Registrar comando para escanear componentes
    const scanCommand = vscode.commands.registerCommand('php-component.scanComponents', () => {
        scanComponentsInWorkspace();
    });
    
    context.subscriptions.push(scanCommand);

    // Iniciar escaneamento de componentes ao carregar
    if (vscode.workspace.workspaceFolders) {
        scanComponentsInWorkspace();
    }

    // Detectar alterações em arquivos PHPX para atualizar componentes
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.phpx');
    
    fileWatcher.onDidChange(uri => {
        const filePath = uri.fsPath;
        scanComponentFile(filePath);
    });
    
    fileWatcher.onDidCreate(uri => {
        const filePath = uri.fsPath;
        scanComponentFile(filePath);
    });
    
    fileWatcher.onDidDelete(uri => {
        const filePath = uri.fsPath;
        // Remove components from this file
        components.forEach((component, name) => {
            if (component.filePath === filePath) {
                components.delete(name);
            }
        });
    });

    context.subscriptions.push(fileWatcher);

    // Registrar provedor de completions para componentes
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'phpx' },
        {
            provideCompletionItems(document, position) {
                // Verificar se estamos dentro de um bloco HTML (entre << e >>)
                const isInHtml = isInsideHtmlBlock(document, position);
                const textLine = document.lineAt(position).text;
                const textBefore = textLine.substring(0, position.character);
                
                // Verificar se estamos começando uma tag dentro de um bloco HTML
                if (isInHtml && textBefore.match(/<[A-Z][a-zA-Z0-9]*$/)) {
                    const completionItems: vscode.CompletionItem[] = [];
                    
                    // Adicionar todos os componentes detectados
                    components.forEach((component, name) => {
                        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
                        item.detail = `Component Class: ${name}`;
                        item.documentation = component.description || `Component that extends Component class`;
                        
                        // Inserir com atributos como snippet
                        let snippetText = name;
                        if (component.properties.length > 0) {
                            snippetText += ' ';
                            component.properties.forEach((prop, index) => {
                                snippetText += `${prop.name}={{$\{${index + 1}:${prop.type}}}${component.properties.length - 1 > index ? ' ' : ''}`;
                            });
                        }
                        snippetText += '>';
                        
                        item.insertText = new vscode.SnippetString(snippetText);
                        completionItems.push(item);
                    });
                    
                    return completionItems;
                }
                
                // Verificar se estamos tentando completar um atributo de componente
                if (isInHtml && isInsideComponentTag(document, position)) {
                    const componentName = getComponentNameAtPosition(document, position);
                    if (componentName && components.has(componentName)) {
                        const component = components.get(componentName)!;
                        const completionItems: vscode.CompletionItem[] = [];
                        
                        component.properties.forEach(prop => {
                            const item = new vscode.CompletionItem(prop.name, vscode.CompletionItemKind.Property);
                            item.detail = `${prop.name}: ${prop.type}`;
                            item.documentation = prop.description || `Property of ${componentName}`;
                            item.insertText = new vscode.SnippetString(`${prop.name}={{$\{1:${prop.type}}}}`);
                            completionItems.push(item);
                        });
                        
                        return completionItems;
                    }
                }
                
                // Se estamos dentro de HTML e tentando escrever HTML normal
                if (isInHtml) {
                    // Delegamos para o provedor de HTML nativo que será registrado pela linguagem embarcada
                    return null;
                }
                
                return null;
            }
        },
        '<', // Trigger character for tag completion
        ' '  // Trigger for attribute completion
    );
    
    // Registrar provedor de hover para componentes
    const hoverProvider = vscode.languages.registerHoverProvider(
        { scheme: 'file', language: 'phpx' },
        {
            provideHover(document, position) {
                // Verificar se estamos dentro de um bloco HTML
                if (!isInsideHtmlBlock(document, position)) {
                    return null;
                }
                
                // Verificar se estamos sobre um componente
                const wordRange = document.getWordRangeAtPosition(position);
                if (!wordRange) {
                    return null;
                }
                
                const word = document.getText(wordRange);
                
                // Verificar se é um componente conhecido
                if (components.has(word)) {
                    const component = components.get(word)!;
                    let hoverContent = new vscode.MarkdownString();
                    
                    hoverContent.appendMarkdown(`# Component: ${component.name}\n\n`);
                    if (component.description) {
                        hoverContent.appendMarkdown(`${component.description}\n\n`);
                    }
                    
                    if (component.properties.length > 0) {
                        hoverContent.appendMarkdown(`## Properties\n\n`);
                        component.properties.forEach(prop => {
                            hoverContent.appendMarkdown(`- **${prop.name}**: ${prop.type}${prop.required ? ' (required)' : ''}\n`);
                            if (prop.description) {
                                hoverContent.appendMarkdown(`  ${prop.description}\n`);
                            }
                        });
                    }
                    
                    return new vscode.Hover(hoverContent);
                }
                
                return null;
            }
        }
    );
    
    context.subscriptions.push(completionProvider, hoverProvider);

    // Registrar embedded language support
    // Tratar conteúdo dentro de << >> como HTML
    registerEmbeddedLanguages(context);
}

// Registrar suporte a linguagens embarcadas
function registerEmbeddedLanguages(context: vscode.ExtensionContext) {
    // Interceptar o tokenizador para tratar conteúdo entre << >> como HTML
    // Esta implementação usa as definições de gramática TextMate no package.json
    // que já estão configuradas para mapear o conteúdo HTML para "text.html.basic"
    
    // Para reforçar a detecção de linguagem embutida em blocos HTML
    const documentSemanticTokensProvider = vscode.languages.registerDocumentSemanticTokensProvider(
        { scheme: 'file', language: 'phpx' },
        {
            provideDocumentSemanticTokens(document) {
                // Apenas para informar o VS Code que há semântica de linguagem embutida
                // A implementação real está na gramática TextMate
                return new vscode.SemanticTokens(new Uint32Array(0));
            }
        },
        new vscode.SemanticTokensLegend([], [])
    );
    
    context.subscriptions.push(documentSemanticTokensProvider);
}

function scanComponentsInWorkspace() {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    
    components.clear();
    
    // Scan only .phpx files for components
    vscode.workspace.findFiles('**/*.phpx').then(uris => {
        uris.forEach(uri => {
            scanComponentFile(uri.fsPath);
        });
    });
}

function scanComponentFile(filePath: string) {
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            console.error(`Erro ao ler arquivo: ${filePath}`, err);
            return;
        }
        
        // Procurar classes que extendem Component
        const classRegex = /class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+Component/g;
        let match;
        
        while ((match = classRegex.exec(content)) !== null) {
            const componentName = match[1];
            
            // Procurar construtor para extrair propriedades
            const constructorMatch = content.match(new RegExp(`function\\s+__construct\\s*\\(([^)]*)\\)\\s*{`, 'g'));
            const properties: ComponentDefinition['properties'] = [];
            
            if (constructorMatch && constructorMatch.length > 0) {
                const params = constructorMatch[0].match(/\(([^)]*)\)/);
                if (params && params[1]) {
                    const paramList = params[1].split(',').map(p => p.trim()).filter(p => p);
                    
                    paramList.forEach(param => {
                        const paramParts = param.split(/\s+/);
                        let type = 'mixed';
                        let name = paramParts[0];
                        
                        if (paramParts.length > 1) {
                            // Suporte a type hints do PHP
                            if (paramParts[0].startsWith('?') || ['string', 'int', 'float', 'bool', 'array', 'object'].includes(paramParts[0])) {
                                type = paramParts[0].startsWith('?') ? paramParts[0].substring(1) + '|null' : paramParts[0];
                                name = paramParts[1];
                            }
                        }
                        
                        // Remover $ do nome da variável se existir
                        if (name.startsWith('$')) {
                            name = name.substring(1);
                        }
                        
                        properties.push({
                            name,
                            type,
                            required: !param.includes('=') // Se não tem valor padrão, é obrigatório
                        });
                    });
                }
            }
            
            // Extrair comentários de documentação para descrição
            let description = '';
            const docCommentRegex = /\/\*\*([\s\S]*?)\*\/\s*class\s+([A-Z][a-zA-Z0-9]*)\s+extends\s+Component/;
            const docMatch = content.match(docCommentRegex);
            
            if (docMatch && docMatch[1] && docMatch[2] === componentName) {
                description = docMatch[1]
                    .replace(/^\s*\*\s?/gm, '') // Remove asteriscos e espaços
                    .trim();
            }
            
            // Registrar componente
            components.set(componentName, {
                name: componentName,
                properties,
                description,
                filePath
            });
        }
    });
}

function isInsideHtmlBlock(document: vscode.TextDocument, position: vscode.Position): boolean {
    // Procurar o bloco HTML atual
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Encontrar as posições dos delimitadores << >> mais próximos
    let lastOpenBlock = text.lastIndexOf('<<', offset);
    let nextCloseBlock = text.indexOf('>>', offset);
    
    // Encontrar o início do close block anterior ao offset
    let lastCloseBlock = -1;
    let searchPos = 0;
    
    while (true) {
        const closePos = text.indexOf('>>', searchPos);
        if (closePos === -1 || closePos >= offset) {
            break;
        }
        lastCloseBlock = closePos;
        searchPos = closePos + 2;
    }
    
    return lastOpenBlock !== -1 && 
           lastOpenBlock > lastCloseBlock && 
           (nextCloseBlock === -1 || nextCloseBlock > offset);
}

function isInsideComponentTag(document: vscode.TextDocument, position: vscode.Position): boolean {
    // Verificar se estamos dentro de uma tag de componente
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Encontrar a última abertura de tag (não fechada) antes da posição
    const lineText = document.lineAt(position).text.substring(0, position.character);
    const match = lineText.match(/<([A-Z][a-zA-Z0-9]*)(?:\s+[^>]*)?$/);
    
    return !!match;
}

function getComponentNameAtPosition(document: vscode.TextDocument, position: vscode.Position): string | null {
    // Encontrar o nome do componente da tag atual
    const lineText = document.lineAt(position).text.substring(0, position.character);
    const match = lineText.match(/<([A-Z][a-zA-Z0-9]*)(?:\s+[^>]*)?$/);
    
    return match ? match[1] : null;
}

export function deactivate() {
    // Limpar recursos quando a extensão for desativada
}