<?php
require_once 'Component.php';

class Button extends Component {
    public function __construct(
        private string $label,
        private int $type = self::TYPE_PRIMARY
    ) {}

    public const TYPE_PRIMARY = 1;
    public const TYPE_SECONDARY = 2;
    public const TYPE_TERTIARY = 3;

    function render(): string {
        $buttonClass = match($this->type) {
            self::TYPE_PRIMARY => "btn-primary",
            self::TYPE_SECONDARY => "btn-secondary",
            self::TYPE_TERTIARY => "btn-tertiary",
            default => "btn-primary"
        };
        
        $html = <<
            <button class="btn {$buttonClass}">{$this->label}</button>
        >>;
        
        // Processar o template com a sintaxe personalizada
        return processComponentTemplate($html);
    }
}