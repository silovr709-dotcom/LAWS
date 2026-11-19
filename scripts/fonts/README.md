# Шрифты для OG-картинок

`build-og.ts` рисует PNG через `@resvg/resvg-js`, а он не читает WOFF2. Поэтому здесь лежат
TTF-версии двух OFL-шрифтов сайта:

- `CormorantGaramond-Medium.ttf` — @fontsource/cormorant-garamond (latin + cyrillic, вес 500);
- `GolosText-Regular.ttf`, `GolosText-Medium.ttf` — @fontsource/golos-text (latin + cyrillic, 400/500).

Оба шрифта распространяются по лицензии SIL Open Font License 1.1.

Пересборка (нужны `fonttools` и `brotli`):

```bash
python -m venv /tmp/fontvenv && /tmp/fontvenv/bin/pip install fonttools brotli
/tmp/fontvenv/bin/python tools/…  # см. историю: merger latin+cyrillic, flavor=None
```

Практически: распаковать WOFF2 (`fontTools.ttLib.TTFont(...).flavor = None`), слить latin и
cyrillic сабсеты через `fontTools.merge.Merger` и сохранить TTF в эту папку.
