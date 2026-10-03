# 📄 Extrator-CASA | Extração Automatizada de Laudos e Amostras via OCR

> Aplicação web desenvolvida para otimizar o fluxo de triagem e digitalização de relatórios técnicos, utilizando OCR para extrair, estruturar e exportar dados amostrais com precisão.

![Status](https://img.shields.io/badge/status-conclu%C3%ADdo-brightgreen)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![OCR](https://img.shields.io/badge/OCR-Document%20Parsing-blueviolet)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎯 Contexto e Problema de Negócio

A digitação manual de relatórios físicos, laudos analíticos e formulários de amostras é um processo lento, repetitivo e sujeito a erros humanos de transcrição. 

O **Extrator-CASA** foi projetado para automatizar essa esteira de entrada de dados: a ferramenta processa imagens e documentos digitalizados, identifica os blocos textuais críticos por Reconhecimento Óptico de Caracteres (OCR) e organiza os resultados em campos estruturados prontos para consulta ou exportação.

### 🌐 Demonstração Online
- **Aplicação no ar:** [Acessar Extrator-CASA](https://projeto-casa-fawn.vercel.app/)
- **Repositório:** [https://github.com/gabrielverass/Extrator-CASA](https://github.com/gabrielverass/Extrator-CASA)

---

## ✨ Principais Funcionalidades

- **Upload e Processamento de Documentos:** Suporte ao envio de capturas e digitalizações de relatórios em alta resolução.
- **Reconhecimento Óptico de Caracteres (OCR):** Varredura inteligente de texto, identificando rótulos, datas, identificadores de amostras e valores tabelados.
- **Higienização e Parsing de Texto:** Filtragem de ruídos visuais e formatação padronizada dos dados capturados via expressões regulares (RegEx).
- **Conferência em Tempo Real:** Interface interativa que permite ao usuário revisar os dados extraídos lado a lado com o documento original antes de salvar.
- **Exportação Estruturada:** Facilidade para copiar os dados ou exportá-los em formatos tabulares (CSV/JSON) para alimentar planilhas ou sistemas legados.

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** React / JavaScript (ES6+), HTML5, CSS3 com foco em produtividade operacional.
- **Mecanismo de OCR / Processamento:** Bibliotecas de processamento de imagem e reconhecimento óptico de texto.
- **Hospedagem & CI/CD:** [Vercel](https://vercel.com/) com deploy automático integrado ao GitHub.

---

## 📁 Estrutura do Projeto

```text
Extrator-CASA/
├── public/                 # Ícones, favicon e recursos visuais estáticos
├── src/
│   ├── assets/             # Imagens e estilos globais
│   ├── components/         # Componentes de upload, pré-visualização e tabela
│   ├── services/           # Lógica do mecanismo de OCR e parsing de texto
│   ├── utils/              # Formatadores de dados e expressões regulares
│   ├── App.jsx             # Estrutura principal da aplicação
│   └── main.jsx            # Ponto de entrada
├── .env.example            # Chaves de API necessárias (se aplicável)
├── .gitignore              # Arquivos ignorados pelo versionamento
├── package.json            # Dependências e scripts do projeto
├── vercel.json             # Configurações de rota e cabeçalhos de deploy
└── README.md               # Documentação técnica do repositório
```

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm` ou `yarn`

### 1. Clonar o repositório
```bash
git clone [https://github.com/gabrielverass/Extrator-CASA.git](https://github.com/gabrielverass/Extrator-CASA.git)
cd Extrator-CASA
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (se aplicável)
Caso utilize serviços externos de OCR, configure o arquivo local:
```bash
cp .env.example .env
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse no navegador através do endereço exibido no terminal (geralmente `http://localhost:5173` ou `http://localhost:3000`).

---

## 🔒 Boas Práticas e Privacidade

- **Tratamento de Dados em Memória:** Os documentos processados não são expostos publicamente nem armazenados permanentemente sem autorização expressa.
- **Segurança de Chaves:** Nenhuma credencial de API ou token de serviço está incluído no versionamento do repositório.

---

## 👨‍💻 Autor

Desenvolvido por **Gabriel Veras**.

- **GitHub:** [@gabrielverass](https://github.com/gabrielverass)
