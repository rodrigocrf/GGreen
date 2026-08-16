# 🟢 GGreen // Terminal Analítico de Risco & Precificação Esportiva

> Assistente avançado e focado em dados para investimentos esportivos com foco estrito em gestão quantitativa de risco e precificação estatística para futebol.

O **GGreen** foi desenvolvido para investidores esportivos e traders que operam sob rigor matemático. Longe de "palpites" ou "achismos", a ferramenta utiliza modelos de distribuição probabilística e fórmulas de gestão de banca consagradas no mercado financeiro para encontrar **Apostas de Valor Esperado Positivo (+EV)** e mitigar o risco de ruína.

---

## 🚀 Funcionalidades Principais

### 1. Gestão de Banca via Critério de Kelly Fracionado
A preservação do capital é a prioridade do GGreen. A ferramenta implementa a fórmula do **Critério de Kelly** para calcular a porcentagem exata da banca a ser exposta a um evento:
$$f^* = \frac{p \cdot b - q}{b}$$
*   **Modelo Fracionado:** O Kelly tradicional pode ser agressivo. Por segurança, o sistema oferece frações reduzidas (**1/4 Kelly** e **1/2 Kelly**) para amortecer a variância e blindar a banca contra sequências de perdas.
*   **Termômetro Dinâmico de Risco:** Categorização visual imediata das stakes em **Baixo Risco** (até 1.5%), **Kelly Justo** (até 5.0%) e **Alto Risco / Ruína** (mais de 5.0% da banca).

### 2. Estimador de True Odds (Fase 1 - Poisson MVP)
Utiliza a **Distribuição de Poisson** independente para cada equipe baseando-se em métricas analíticas de desempenho ofensivo e defensivo:
*   **Expected Goals (xG):** Gols esperados com base no volume e perigo real das finalizações criadas.
*   **Expected Goals Against (xGA):** Avaliação de solidez da defesa (gols sofridos esperados).
*   **Matriz de Probabilidades:** Cruza o número de gols projetados para calcular com exatidão a probabilidade implícita de vitória do mandante, empate e vitória do visitante, gerando as **True Odds** (Odds Justas) do mercado.

### 3. Explicabilidade Pedagógica (Pedagogic Tooltips)
Focado na transparência, o terminal fornece balões explicativos (`?`) em todos os campos numéricos. A lógica foi desenhada de forma 100% segura contra injeções de scripts, traduzindo conceitos estatísticos complexos para usuários leigos em linguagem simplificada e prática.

---

## 🛠️ Stack Tecnológica

*   **Backend:** Node.js, Express, TypeScript (Compilação estrita).
*   **Validação de Dados:** Zod (Validação estrutural e fail-fast no startup para variáveis de ambiente).
*   **Segurança (Hardening):**
    *   **Helmet.js:** Configuração de headers HTTP seguros e ocultação de assinaturas tecnológicas (`X-Powered-By`).
    *   **Rate Limiting:** Proteção contra força bruta e requisições automatizadas abusivas.
    *   **CORS Estrito:** Acesso permitido apenas a domínios de origem autorizados.
    *   **Error Handler Seguro:** Mascaramento de *Stack Traces* em produção para evitar vazamento de dados de infraestrutura.
*   **Frontend:** Single Page Application (SPA) em HTML5 Semântico, Vanilla JS e Vanilla CSS (Design system customizado em HSL, sem frameworks pesados ou templates prontos).

---

## 📂 Arquitetura do Projeto (Service-Oriented MVC)

O projeto adota uma variação do padrão MVC, separando a recepção HTTP das regras matemáticas de precificação:

```
GGreen/
├── public/                 # Frontend estático servido pelo Express
│   ├── css/main.css        # Design System retro-futurista (HSL + Grid)
│   ├── js/app.js           # Lógica do cliente e validação DOM (Anti-XSS)
│   └── index.html          # SPA e marcações de acessibilidade
├── src/
│   ├── config/             # Configurações de ambiente validadas com Zod
│   ├── controllers/        # Thin Controllers para validação rápida do HTTP
│   ├── middlewares/        # Proteções de segurança (Helmet, Rate Limit, Erros)
│   ├── models/             # Tipagens e schemas de dados (.gitkeep)
│   ├── repositories/       # Persistência de dados (.gitkeep)
│   ├── scrapers/           # Automação de capturas e APIs (.gitkeep)
│   ├── services/           # Lógica analítica pura (Poisson, Kelly, True Odds)
│   ├── app.ts              # Setup do Express e middlewares
│   └── server.ts           # Bootstrapping e encerramento gracioso do processo
├── .env.example            # Modelo de configuração de ambiente
├── tsconfig.json           # Regras do compilador TypeScript
└── package.json            # Scripts de execução e dependências
```

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)
*   [Git](https://git-scm.com/)

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/rodrigocrf/GGreen.git
cd GGreen
```

### Passo 2: Instalar Dependências
```bash
npm install
```

### Passo 3: Configurar Variáveis de Ambiente
Duplique o arquivo `.env.example` na raiz do projeto e renomeie-o para `.env`:
```bash
cp .env.example .env
```
Abra o arquivo `.env` e configure as variáveis caso queira mudar as portas ou limites padrão:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Passo 4: Executar a Aplicação

#### Modo de Desenvolvimento (Live-Reload)
Para executar com compilação instantânea em memória e atualizações dinâmicas:
```bash
npm run dev
```

#### Modo de Produção (Compilado)
Para compilar o código TypeScript em JavaScript otimizado e rodar o servidor compilado:
```bash
# Compilar TypeScript
npm run build

# Iniciar o servidor
npm start
```

### Passo 5: Acessar no Navegador
Após iniciar o servidor, abra no seu navegador:
👉 **[http://localhost:3000/](http://localhost:3000/)**

---

## 🛡️ Diretrizes de Desenvolvimento Seguro

Este repositório foi construído sob um rigoroso modelo de segurança:
1.  **Zero Credenciais no Git:** O arquivo `.env` está explicitamente no `.gitignore`.
2.  **Proteção contra XSS:** No frontend, qualquer injeção dinâmica de conteúdo utiliza `.textContent` ou nós estruturados (`document.createElement`), evitando manipulações inseguras de `.innerHTML`.
3.  **Fail-Fast:** Se alguma variável de ambiente obrigatória estiver ausente no startup do backend, o Zod interrompe a inicialização notificando o erro de forma clara, prevenindo deploys falhos em produção.
