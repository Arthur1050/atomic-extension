<?php
// Incluir os arquivos necessários
require_once 'Component.php';
require_once 'Button.php';

// Implementação de um componente de cartão usando o framework
class Card extends Component {
    public function __construct(
        private string $title,
        private string $content,
        private ?Button $button = null
    ) {}

    function render(): string {
        // Usando a sintaxe personalizada << >>
        // O framework processará isso em tempo de execução
        $html = <<
            <div class="card">
                <div class="card-header">
                    <h3>{$this->title}</h3>
                </div>
                <div class="card-body">
                    {$this->content}
                    
                    <!-- Condicionalmente renderizando outro componente -->
                    {{ $this->button ? $this->button->render() : '' }}
                </div>
            </div>
        >>;

        // Processando o template (em um cenário real, o framework faria isso automaticamente)
        return processComponentTemplate($html);
    }
}

// Testando o framework
$button = new Button('Clique aqui', Button::TYPE_PRIMARY);
$card = new Card('Meu Cartão', 'Este é um exemplo de componente usando a sintaxe personalizada', $button);

// A sintaxe personalizada foi processada e convertida para HTML
echo $card->render();