# Оперативная память (`ram`)

**Выборка:** 4 товар(ов) на категорию. **Поле category у товара:** `Оперативная память`.

## Товары в выборке

- Оперативная память Samsung M391A4G43BB1-CWEQY (`c35d1e14-d99b-4b72-aa95-e4392a4595ba`)
- Оперативная память Digma 32ГБ DDR5 SODIMM 4800 МГц DGMAS54800032D (`8d854ef6-91eb-4a09-ac4c-ebed3b6fd08a`)
- Оперативная память Kingston FURY Beast RGB 4x16ГБ DDR5 6000 МГц KF560C40BBAK4-64 (`67d13924-2f38-4187-8996-8c456b520dd8`)
- Оперативная память Digma 32ГБ DDR4 SODIMM 3200 МГц DGMAS43200032D (`8fcee7b2-eb6a-436c-97a1-3c44339edbdd`)

## Характеристики (колонка за колонкой)

| specKey | canonical | rule | eval | best idx | values (сокр.) | вердикт |
| --- | --- | --- | --- | --- | --- | --- |
| capacity | capacity | max/number | max | 2 | ["32","32","64","32"] | OK |
| cas_latency | cas_latency | min/number | min | 0,3 | ["22T","40T","40T","22T"] | OK |
| e_c_c | e_c_c | none/text | none | — | ["Да","Нет","Нет","Нет"] | OK |
| pcиндекс | pcиндекс | none/text | none | — | ["PC4-25600","PC5-38400","PC5-48000","PC4-25600"] | OK |
| type | type | compatibility/text | compatibility | — | ["DDR4 DIMM Registered","DDR5 SO-DIMM","2Gx8","DDR4 SO-DIMM"] | OK |
| высота | высота | none/text | none | — | [null,null,"42.23 мм",null] | OK |
| ёмкость_микросхем | ёмкость_микросхем | none/text | none | — | [null,null,"16 Гбит",null] | OK |
| количество_ранков | количество_ранков | none/text | none | — | [null,"2","1","2"] | OK |
| набор | набор | none/text | none | — | ["1 модуль","1 модуль","4 модуля","1 модуль"] | OK |
| напряжение_питания | voltage | min/number | min | 1 | ["1.2 В","1.1 В","1.35 В","1.2 В"] | OK |
| низкопрофильный_модуль | низкопрофильный_модуль | none/text | none | — | ["Нет","Нет","Нет","Нет"] | OK |
| общий_объем | capacity | max/number | max | 2 | ["32 ГБ","32 ГБ","64 ГБ","32 ГБ"] | OK |
| объем_одного_модуля | capacity_per_module | max/number | max | — | [null,null,"16 ГБ",null] | OK |
| охлаждение | охлаждение | none/text | none | — | ["Нет","Нет","Да","Нет"] | OK |
| поддержка_amd_expo | поддержка_amd_expo | none/text | none | — | [null,"Нет","Нет",null] | OK |
| подсветка_элементов_платы | подсветка_элементов_платы | none/text | none | — | ["Нет","Нет","многоцветная (RGB)","Нет"] | OK |
| профили_amd_expo | профили_amd_expo | none/text | none | — | [null,null,null,"Нет"] | OK |
| профили_amp | профили_amp | none/text | none | — | ["Нет",null,null,null] | OK |
| профили_intel_xmp | профили_intel_xmp | none/text | none | — | [null,null,null,"Нет"] | OK |
| профили_xmp | профили_xmp | none/text | none | — | ["Нет","Нет","3.0",null] | OK |
| расположение_чипов | расположение_чипов | none/text | none | — | [null,null,"одностороннее","двустороннее"] | OK |
| тайминги | тайминги | none/text | none | — | ["22-22-22-46",null,"40-40-40","22-22-22-52"] | OK |
| тип | тип | none/text | none | — | ["DDR4 DIMM Registered","DDR5 SO-DIMM","DDR5 DIMM","DDR4 SO-DIMM"] | OK |
| тип_микросхем | тип_микросхем | none/text | none | — | [null,null,"2Gx8",null] | OK |
| цвет | цвет | none/text | none | — | ["зеленый","черный","черный","зеленый"] | OK |
| частота | frequency | max/number | max | 2 | ["3200 МГц","4800 МГц","6000 МГц","3200 МГц"] | OK |
| число_микросхем | число_микросхем | none/text | none | — | [null,null,"8","16"] | OK |

## Примечание

Строки с `evaluation.mode = none` не подсвечивают «лучшее» — это ожидаемо для текстовых/спорных полей или при недостатке сопоставимых чисел.