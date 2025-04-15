# Atomic PHP Component Framework

Esta extensão fornece suporte para desenvolvimento de componentes PHP com syntax highlighting e intellisense.

## Uso do Template HTML em Componentes

Para usar blocos HTML em seus componentes, use os delimitadores `<<` e `>>`:

```php
function render(): string {
    return <<
        <button class="btn btn-primary">{$this->label}</button>
    >>;
}
```

### Expressões PHP dentro do template

Você pode incluir variáveis PHP diretamente usando a sintaxe `{$variable}`:

```php
<<
    <div class="container">{$this->content}</div>
>>
```

Para expressões mais complexas, use a sintaxe de chaves duplas:

```php
<<
    <div class="container">{{ $this->getContent() }}</div>
>>
```

### Componentes aninhados

Você pode usar outros componentes dentro do seu template HTML:

```php
<<
    <div class="card">
        <Button label="Clique aqui" type="{{ Button::TYPE_PRIMARY }}" />
    </div>
>>
```

## Escaneando componentes

Para que a extensão forneça intellisense para seus componentes, execute o comando:

```
PHP Component: Scan Components in Workspace
```

Este comando pode ser executado através da paleta de comandos (Ctrl+Shift+P).

## Estrutura de um componente

Um componente básico deve seguir esta estrutura:

```php
class NomeDoComponente extends Component {
    public function __construct(
        // Propriedades do componente aqui
        private string $prop1,
        private int $prop2 = 1
    ) {}

    function render(): string {
        return <<
            <!-- Seu HTML aqui -->
            <div>{$this->prop1}</div>
        >>;
    }
}
```

A extensão escaneará automaticamente seu workspace em busca de classes que estendem `Component` e fornecerá autocompleção para elas.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
