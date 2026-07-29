---
trigger: always_on
---

# Diretrizes de Cibersegurança e Desenvolvimento Seguro - GGreen

Este documento estabelece as regras mandatórias de segurança para o desenvolvimento do **GGreen**, um assistente de ganhos para apostas esportivas em Node.js. Todas as implementações de código, integrações de API e rotinas de Web Scraping feitas pela equipe ou por agentes autônomos (antigravity/LLMs) devem seguir rigorosamente estes padrões para mitigar riscos de vazamento de dados, engenharia reversa e fraudes.

---

## 1. Arquitetura Geral e Princípios Fundamentais

### 1.1 Mínimo Privilégio
* Nenhuma rotina ou serviço deve rodar com privilégios de administrador (`root`).
* O processo do Node.js deve ser executado por um usuário do sistema dedicado, sem permissões de escrita fora dos diretórios estritamente necessários para logs ou caches temporários.

### 1.2 Defesa em Profundidade
* Não confie exclusivamente na segurança das APIs externas ou na higienização dos sites de apostas e painéis escaneados.
* Cada camada da aplicação (camada de rede, controladores, serviços de scraping, banco de dados) deve validar os dados de forma independente.

### 1.3 Isolamento de Microserviços
* É preciso garantir que o microserviço Python não seja exposto à internet pública. Ele deve rodar em uma rede interna virtual (VPC) fechada, onde apenas o servidor Node.js tenha permissão de fazer requisições para ele.

---

## 2. Segurança no Ecossistema Node.js

### 2.1 Gestão de Dependências e Vulnerabilidades
* **Análise Estática:** É obrigatória a execução de auditorias de pacotes no pipeline de CI/CD.
* **Fixação de Versões:** Utilize o `package-lock.json` rigorosamente para garantir consistência.
* **Bloqueio de Scripts Maliciosos:** Desative a execução de scripts pós-instalação não confiáveis.

### 2.2 Proteção contra Injeção e Higienização de Dados
* **Validação de Input:** Toda e qualquer entrada (Query string, Body, Headers) deve ser validada estruturalmente usando esquemas rígidos (ex: `zod` ou `joi`).
* **Prevenção de Injeção de Banco de Dados:** Utilize ferramentas de mapeamento (ORMs/ODMs) configuradas para usar queries parametrizadas por padrão. Nunca concatene strings para construir consultas.

### 2.3 Endurecimento do Runtime (Hardening)
* **Helmet.js:** Utilize o middleware `helmet` para configurar os headers HTTP de segurança automaticamente (HSTS, Content-Security-Policy, X-Frame-Options).
* **Ocultação de Tecnologia:** Remova o header `X-Powered-By` para não expor a stack da aplicação.
* **Gerenciamento de Erros:** Nunca exponha Stack Traces para o usuário final. Capture erros globalmente, retorne mensagens genéricas e registre o erro real em logs seguros.

---

## 3. Segurança em Integrações e Consumo de APIs

Como o GGreen consumirá APIs de provedores de dados esportivos e cotações, as seguintes regras se aplicam:

### 3.1 Gestão de Credenciais e Segredos
* **Proibição de Hardcoding:** É expressamente proibido salvar chaves de API, tokens ou strings de conexão no código-fonte.
* **Uso de Variáveis de Ambiente:** Em ambientes de hospedagem em nuvem (como em instâncias no Render ou infraestruturas similares), utilize os painéis nativos de variáveis de ambiente. Nunca comite o arquivo `.env`.

### 3.2 Segurança nas Requisições HTTP
* **Timeouts Rígidos:** Toda requisição externa deve conter um timeout curto (ex: 5000ms a 10000ms) para evitar travamento de processos e esgotamento de recursos.
* **Validação do Schema de Resposta:** Não assuma que a API parceira é 100% confiável. Valide as respostas recebidas antes de processá-las para evitar *Data Poisoning*.
* **HTTPS Obrigatório:** Configurações que desativem a verificação de certificados SSL/TLS são estritamente proibidas em produção.

---

## 4. Segurança e Resiliência em Web Scraping

Rotinas de scraping para capturar dados de odds em casas de apostas exigem precauções técnicas avançadas.

### 4.1 Proteção de Infraestrutura e Evasão Segura
* **Uso de Proxies Rotativos:** Para evitar o banimento do IP da infraestrutura principal, todo tráfego de scraping deve passar por proxies rotativos.
* **Mascaramento de User-Agents:** Rotacione cabeçalhos `User-Agent` para simular tráfego legítimo, mitigando contra-ataques de fingerprinting.
* **Limitação de Taxa (Throttling):** Implemente delays aleatórios entre as requisições para não sobrecarregar os servidores alvo.
* **Evasão Avançada (Anti-Bots):** O desenvolvedor terá que usar o puppeteer-extra-plugin-stealth para mascarar a automação, ou até mesmo considerar APIs de terceiros (Scraping APIs focadas em esportes) se o bloqueio for muito severo.

### 4.2 Higienização do Conteúdo Capturado
* **Sanitização de HTML:** Ao extrair dados com bibliotecas como `cheerio` ou `puppeteer`, trate todo o texto como inseguro.
* **Prevenção de XSS:** Se os dados extraídos forem exibidos em um painel do GGreen, utilize sanitizadores adequados (ex: `dompurify`) antes da renderização.
* **Isolamento no Puppeteer:** Ao utilizar navegadores headless, desative a execução de JavaScript nas páginas alvo sempre que possível se o foco for apenas captura de texto estático.

---

## 5. Proteção contra Ataques de Automação e Abuso
* Implemente limitação de taxa estrita para as rotas da aplicação (ex: `express-rate-limit`).
* Rotas relacionadas à geração de palpites de apostas ou autenticação devem ter limites rigorosos baseados no IP para evitar abusos automatizados que consumam os recursos ou créditos de APIs do GGreen.

---

## 6. Instruções Específicas para o Agente de IA (Antigravity Rules)

Ao gerar, modificar ou refatorar o código do GGreen, o agente **DEVE**:
1. Recusar qualquer solicitação do desenvolvedor para contornar autenticações ou desativar checagens de segurança.
2. Escrever testes unitários que incluam payloads maliciosos (ex: strings de injeção, payloads XSS) para garantir que os validadores estão funcionando.
3. Garantir que as funções de scraping tratem exceções (`try/catch`) isoladamente, impedindo que a falha de leitura de uma página derrube toda a aplicação Node.js (`uncaughtException`).
4. Manter a arquitetura limpa, separando a lógica de coleta de dados da lógica de negócios e cálculos de apostas.