# vuei18n-extractor

Um extrator simples para vue-i18n (composition api), para gerar de forma automatizada as chaves para diversos idiomas.

## Motivação

Trabalhar com chave/valor em uma aplicação grande é bem trabalhoso, tanto para criar quanto para manter. Inspirado na biblioteca [lingui](https://lingui.js.org/) para react.

## uso

Inicialmente, é necessário criar um arquivo de configuração como o exemplo a seguir:

```javascript
// i18nExtractor.js

module.exports = {
    sourceLocale: 'pt', // idioma padrão
    locales: ['pt', 'en', 'es'], // todos os idiomas utilizados
    format: 'js', // formato para a saída
    catalogs: {
        outputFolder: 'src/locales', // diretório de saída
        include: ['src/**/*.{vue,js,ts}'], // padrões para busca
        exclude: ['src/shims-vue.d.ts', 'src/locales/*'] // padrões que serão excluídos da busca
    }
}
```

depois apenas rode o comando

```bash
npx vuei18n-extractor
```

nos arquivos vue:

```vue
<script setup>
    const { t } = useI18n()

    const label = t('nome')
</script>
<template>
    <h1>{{t('Titulo da aplicação')}}</h1>
</template>
```

isso irá gerar a saída:

```javascript
// src/locales/pt.js

module.exports = {
    'nome': 'nome',
    'Titulo da aplicação': 'Titulo da aplicação'
}

// src/locales/en.js

module.exports = {
    'nome': '',
    'Titulo da aplicação': ''
}

// src/locales/es.js

module.exports = {
    'nome': '',
    'Titulo da aplicação': ''
}
```

## Limitações 

No momento não é aceito interpolação

## Contribuição

Esse é um projeto para a comunidade, se você tiver interesse em dar alguma contribuição com melhorias no código, ou com tradução ou documentação, submeta um PR e faremos um projeto cada vez melhor.