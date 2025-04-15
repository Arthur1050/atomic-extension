<?php

abstract class Component {
    /**
     * Método que deve ser implementado pelos componentes filhos
     * para retornar a marcação HTML
     */
    abstract public function render(): string;

    /**
     * Processa os blocos de template com delimitadores << >>
     * e executa as expressões PHP dentro deles
     * 
     * @param string $template Template com a sintaxe personalizada
     * @return string HTML processado
     */
    protected function processTemplate(string $template): string {
        // Remove os delimitadores << >> e extrai o conteúdo
        if (preg_match('/<<\s*([\s\S]*?)\s*>>/', $template, $matches)) {
            $content = $matches[1];
            
            // Processa expressões PHP dentro de {{ }}
            $content = preg_replace_callback('/\{\{(.*?)\}\}/', function($matches) {
                $expr = trim($matches[1]);
                return "<?php echo {$expr}; ?>";
            }, $content);
            
            // Processa variáveis PHP dentro de {$ }
            $content = preg_replace_callback('/\{\\$(.*?)\}/', function($matches) {
                $var = trim($matches[1]);
                return "<?php echo \${$var}; ?>";
            }, $content);
            
            // Usa output buffering para capturar a saída
            ob_start();
            eval("?>{$content}<?php ");
            $renderedTemplate = ob_get_clean();
            
            return $renderedTemplate;
        }
        
        return $template;
    }
    
    /**
     * Método mágico para renderização do componente como string
     */
    public function __toString(): string {
        return $this->render();
    }
}

/**
 * Função auxiliar para processar templates com a sintaxe personalizada
 * 
 * @param string $template Template com a sintaxe personalizada
 * @return string HTML processado
 */
function processComponentTemplate(string $template): string {
    // Remove os delimitadores << >> e extrai o conteúdo
    if (preg_match('/<<\s*([\s\S]*?)\s*>>/', $template, $matches)) {
        $content = $matches[1];
        
        // Processa expressões PHP dentro de {{ }}
        $content = preg_replace_callback('/\{\{(.*?)\}\}/', function($matches) {
            $expr = trim($matches[1]);
            return "<?php echo {$expr}; ?>";
        }, $content);
        
        // Processa variáveis PHP dentro de {$ }
        $content = preg_replace_callback('/\{\\$(.*?)\}/', function($matches) {
            $var = trim($matches[1]);
            return "<?php echo \${$var}; ?>";
        }, $content);
        
        // Usa output buffering para capturar a saída
        ob_start();
        eval("?>{$content}<?php ");
        $renderedTemplate = ob_get_clean();
        
        return $renderedTemplate;
    }
    
    return $template;
}