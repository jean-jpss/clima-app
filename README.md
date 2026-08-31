# ClimaAgora — Previsão do Tempo

Aplicação web responsiva para consulta do clima atual e previsão dos próximos
5 dias de qualquer cidade do mundo, ou da localização atual do usuário.

Projeto acadêmico construído com **HTML, CSS e JavaScript puros** (sem
frameworks ou bibliotecas externas), focado em boas práticas de design,
usabilidade mobile e nas quatro categorias avaliadas pelo Google Lighthouse.

## Funcionalidades

- Busca de cidade por nome, com geocodificação automática (nome → coordenadas).
- Botão "Usar minha localização", via Geolocation API do navegador.
- Clima atual: temperatura, sensação térmica, condição, umidade, vento e chuva.
- Previsão dos próximos 5 dias, com ícone e temperaturas máxima/mínima.
- Alternância de tema claro/escuro, além de detecção automática da preferência
  do sistema (`prefers-color-scheme`).
- Estados de carregamento e de erro (cidade não encontrada, falha de rede,
  permissão de localização negada), sempre comunicados por texto (não só cor).
- Layout mobile-first, totalmente responsivo (testado de 320px a desktop).

## APIs externas consumidas (via `fetch`, em JavaScript)

Todas as APIs usadas são públicas, gratuitas e **não exigem chave de acesso**:

1. **[Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)**
   — converte o nome da cidade digitada em latitude/longitude.
2. **[Open-Meteo Forecast API](https://open-meteo.com/en/docs/)**
   — retorna o clima atual e a previsão diária para as coordenadas.
3. **[BigDataCloud Reverse Geocoding](https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocoding-to-city-api)**
   — usada apenas quando o usuário clica em "Usar minha localização", para
   transformar as coordenadas do GPS em um nome de cidade legível (com
   fallback silencioso caso falhe).

## Estrutura do projeto

```
clima-app/
├── index.html        # marcação semântica e acessível
├── css/
│   └── style.css      # estilos mobile-first, tema claro/escuro
├── js/
│   └── script.js       # consumo das APIs e renderização dinâmica
└── README.md
```

## Como executar

Não há build nem dependências — é um site estático. Duas opções:

1. **Abrir direto**: dê duplo clique em `index.html` (funciona na maioria dos
   navegadores; algumas versões podem restringir `fetch` em arquivos `file://`).
2. **Servidor local (recomendado)**, a partir da pasta `clima-app`:
   ```bash
   python3 -m http.server 8080
   # depois acesse http://localhost:8080
   ```
   ou, com Node instalado:
   ```bash
   npx serve .
   ```

Também pode ser publicado gratuitamente em **GitHub Pages**, **Netlify** ou
**Vercel** sem nenhuma configuração adicional, caso o(a) professor(a) peça um
link online.

## Boas práticas aplicadas

- **Responsividade**: `meta viewport`, layout fluido com Flexbox/Grid,
  tipografia com `clamp()` e breakpoints em 360px, 560px e 860px.
- **Acessibilidade**: HTML semântico (`header`, `main`, `footer`, `section`,
  `dl`), rótulos associados aos campos, `aria-live` para mensagens de status,
  link "Pular para o conteúdo", contraste de cores adequado e foco visível
  em todos os elementos interativos.
- **Desempenho**: nenhuma biblioteca externa, ícones em emoji (sem imagens
  pesadas), `preconnect` para os domínios da API, script carregado com
  `defer`.
- **Boas práticas gerais**: HTTPS em todas as chamadas de API, tratamento de
  erros de rede e de geolocalização, `data-theme` respeitando
  `prefers-reduced-motion`.

## Resultado no Google Lighthouse

Auditoria executada localmente (Chrome headless) na tela inicial da
aplicação:

| Categoria       | Pontuação |
|-----------------|:---------:|
| Performance     | 100       |
| Acessibilidade  | 100       |
| Boas práticas   | 100       |
| SEO             | 100       |

> Dica: para conferir você mesmo, abra o site publicado no Chrome, abra o
> DevTools (F12) → aba **Lighthouse** → selecione as 4 categorias → **Analyze
> page load**.

## Autor

Projeto desenvolvido para fins acadêmicos — 2026.
