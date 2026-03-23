# Аудит фильтров каталога

Дата: 2026-03-23T10:49:12.947Z
API: http://localhost:5000

---
## Процессоры (`processors`)

### Сокет (`socket`) — select

Всего значений: 15

```
AM4
AM5
LGA1151
LGA1151-2
LGA1200
LGA1700
LGA1851
LGA2066
LGA3647
LGA4189
LGA4677
SP3
SP5
sWRX8
TR5
```

### Модельный ряд (`model_series`) — select

Всего значений: 21

```
Athlon
Athlon Pro
Athlon X4
Celeron
Core i3
Core i5
Core i7
Core i9
Core Ultra 5
Core Ultra 7
Epyc 7000
Epyc 7003
Epyc 9004
Epyc 9005
Pentium
Ryzen 5
Ryzen 7
Ryzen 9
Ryzen Threadripper
Xeon
Xeon E
```

### Кодовое название (`codename`) — select

Всего значений: 26

```
Alder Lake
Arrow Lake
Bristol Ridge
Cascade Lake
Cezanne
Coffee Lake
Comet Lake
Emerald Rapids
Genoa
Granite Ridge
Ice Lake
Matisse
Milan
Phoenix
Picasso
Raphael
Raptor Lake
Raptor Lake-R
Raven Ridge
Renoir
Rocket Lake
Rome
Sapphire Rapids
Skylake
Storm Peak
Vermeer
```

### Архитектура (`architecture`) — select

Всего значений: 17

```
Alder Lake
Arrow Lake
Cascade Lake
Coffee Lake
Comet Lake
Emerald Rapids
Genoa
Ice Lake
Milan
Raptor Lake
Rocket Lake
Rome
Sapphire Rapids
Skylake
Zen 3
Zen 4
Zen 5
```

### Дата выхода, г (`data_vykhoda_na_rynok`) — range


### Встроенная графика (`integrated_graphics`) — select

Всего значений: 2

```
Нет
Есть
```

### Количество ядер (`cores`) — range


### Потоков (`threads`) — range


### Базовая частота, ГГц (`base_freq`) — range


### Макс. частота, ГГц (`max_freq`) — range


### Макс. частота памяти, МГц (`max_memory_freq`) — range


### TDP, Вт (`tdp`) — range


### Тип поставки (`delivery_type`) — select

Всего значений: 3

```
BOX
OEM
WOF
```

### Охлаждение в комплекте (`cooling_included`) — select

Всего значений: 2

```
Нет
Есть
```

### Техпроцесс, нм (`process_nm`) — range


### Кэш L2, МБ (`cache_l2`) — range


### Кэш L3, МБ (`cache_l3`) — range


### Поддержка памяти (`memory_support`) — select

Всего значений: 4

```
DDR3, DDR4
DDR4
DDR4, DDR5
DDR5
```

### Каналы памяти (`memory_channels`) — range


### Многопоточность (`multithreading`) — select

Всего значений: 2

```
Нет
Есть
```

## Видеокарты (`gpu`)

### Дата выхода, г (`release_year`) — range


### Производитель ГП (`proizvoditel_graficheskogo_protsessora`) — select

Всего значений: 3

```
AMD
Intel
NVIDIA
```

### Графический процессор (`graficheskiy_protsessor`) — select

Всего значений: 58

```
CMP 170HX
GeForce 210
GeForce GT 1030
GeForce GT 210
GeForce GT 240
GeForce GT 610
GeForce GT 710
GeForce GT 730
GeForce GT 740
GeForce GTX 1050 Ti
GeForce GTX 1650
GeForce GTX 1660 Super
GeForce GTX 1660 Ti
GeForce GTX 750
GeForce RTX 2060
GeForce RTX 2060 Super
GeForce RTX 3050
GeForce RTX 3060
GeForce RTX 3060 Ti
GeForce RTX 3070
GeForce RTX 3080
GeForce RTX 3090
GeForce RTX 4060 Ti
GeForce RTX 4070 Ti
GeForce RTX 4080
GeForce RTX 4090
GeForce RTX 5050
GeForce RTX 5060
GeForce RTX 5060 Ti
GeForce RTX 5070
GeForce RTX 5070 Ti
GeForce RTX 5080
GeForce RTX 5090
GeForce RTX 5880
Intel Arc A380
Radeon R5 220
Radeon R5 230
Radeon R7 350
Radeon R9 370
Radeon RX 550
Radeon RX 560
Radeon RX 580
Radeon RX 6650 XT
Radeon RX 6800
Radeon RX 7600
Radeon RX 9060
Radeon RX 9060 XT
Radeon RX 9070
Radeon RX 9070 XT
RTX 2000
... и ещё 8
```

### Видеопамять, ГБ (`videopamyat`) — range


### Тип видеопамяти (`tip_videopamyati`) — select

Всего значений: 9

```
DDR2
DDR3
DDR4
GDDR3
GDDR5
GDDR6
GDDR6X
GDDR7
HBM2e
```

### Ширина шины, бит (`shirina_shiny_pamyati`) — range


### Охлаждение (`okhlazhdenie_1`) — select

Всего значений: 3

```
активное
жидкостное
пассивное
```

### Разъёмы питания (`razyemy_pitaniya`) — select

Всего значений: 7

```
16 pin
16 pin (12VHPWR)
6 pin
8 pin
8+8 pin
8+8+8 pin
Не требуется
```

### Интерфейс (`interfeys_1`) — select

Всего значений: 9

```
PCI Express x16 2.0
PCI Express x16 2.1
PCI Express x16 3.0
PCI Express x16 4.0
PCI Express x16 5.0
PCI Express x4 4.0
PCI Express x8 2.0
PCI Express x8 4.0
PCI Express x8 5.0
```

### Рек. БП, Вт (`rekomenduemyy_blok_pitaniya`) — range


### Длина, мм (`dlina_videokarty`) — range


### Высота, мм (`vysota_videokarty`) — range


## Материнские платы (`motherboards`)

### Сокет (`socket`) — select

Всего значений: 12

```
AM4
AM5
LGA1150
LGA1151
LGA1200
LGA1700
LGA1851
LGA2011-3
LGA2066
LGA4189
LGA4677
SP3
```

### Чипсет (`chipset`) — select

Всего значений: 43

```
A520
A620
A620A
B250
B450
B550
B650
B650E
B660
B760
B840
B850
B860
C226
C252
C262
C422
C612
C621
C741
H310
H470
H510
H610
H770
H810
HM65
Q470
Q570
Q670
Q870
TRX50
W480
W680
W790
W880
WRX90
X670E
X870
X870E
Z690
Z790
Z890
```

### Форм-фактор (`form_factor`) — select

Всего значений: 4

```
ATX
eATX
mATX
Mini-ITX
```

### Тип памяти (`memory_type`) — select

Всего значений: 3

```
DDR3
DDR4
DDR5
```

### Слоты DDR4+DDR5 (`memory_mixed_slots`) — select

Всего значений: 2

```
Да
Нет
```

### DDR5 CUDIMM (`memory_cudimm`) — select

Всего значений: 2

```
Да
Нет
```

### Слотов памяти (`memory_slots`) — range


### Макс. память, ГБ (`max_memory`) — range


### Частота памяти, МГц (`max_memory_freq`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## ОЗУ (`ram`)

### Объём, ГБ (`capacity`) — range


### Объём модуля, ГБ (`capacity_per_module`) — range


### Тип памяти (`type`) — select

Всего значений: 8

```
DDR3 DIMM
DDR3 SO-DIMM
DDR4 DIMM
DDR4 DIMM Registered
DDR4 SO-DIMM
DDR5 DIMM
DDR5 DIMM Registered
DDR5 SO-DIMM
```

### Частота, МГц (`frequency`) — range


### PC-индекс (`pc_index`) — select

Всего значений: 23

```
PC3-10600
PC3-12800
PC4-17000
PC4-19200
PC4-21300
PC4-25600
PC4-26400
PC4-28800
PC4-32000
PC4-38400
PC5-38400
PC5-41600
PC5-44800
PC5-48000
PC5-51200
PC5-52800
PC5-56000
PC5-57600
PC5-60800
PC5-64000
PC5-65600
PC5-67200
PC5-70400
```

### CAS Latency (`cas_latency`) — range


### ECC (`ecc`) — select

Всего значений: 2

```
Нет
Да
```

### Напряжение, В (`voltage`) — range


### Поддержка AMD EXPO (`expo`) — select

Всего значений: 2

```
Нет
Да
```

### Профили XMP (`xmp`) — select

Всего значений: 2

```
Нет
Да
```

### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Накопители (`storage`)

### Объём, ГБ (`capacity`) — range


### Форм-фактор (`form_factor`) — select

Всего значений: 4

```
2.5"
3.5"
M.2
mSATA
```

### Интерфейс (`interface`) — select

Всего значений: 13

```
PCI Express 3.0 x2
PCI Express 3.0 x4
PCI Express 4.0 x4
PCI Express 5.0 x2
PCI Express 5.0 x4
SAS 2.0
SAS 3
SAS 3.0
SAS 4
SATA 3.0
SATA 3.1
SATA 3.3
U.2
```

### Протокол (`protocol`) — select

Всего значений: 3

```
NVMe
SAS
SATA
```

### Тип Flash (`flash_type`) — select

Всего значений: 6

```
3D MLC NAND
3D QLC NAND
3D TLC NAND
MLC
SLC
TLC
```

### Чтение, МБ/с (`read_speed`) — range


### Запись, МБ/с (`write_speed`) — range


### TBW, ТБ (`tbw`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Блоки питания (`psu`)

### Мощность, Вт (`wattage`) — range


### Сертификат 80+ (`efficiency`) — select

Всего значений: 7

```
80+
80+ Bronze
80+ Gold
80+ Platinum
80+ Silver
80+ Titanium
Без сертификата
```

### Форм-фактор (`form_factor`) — select

Всего значений: 5

```
ATX
Flex ATX
SFX
SFX-L
TFX
```

### Модульный (`modular`) — select

Всего значений: 3

```
Нет
Полностью модульный
Полумодульный
```

### Вентилятор, мм (`fan_size`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Корпуса (`cases`)

### Форм-фактор (`form_factor`) — select

Всего значений: 12

```
12” x 12”
ATX
eATX
eATX (до 280 мм)
Flex ATX
mATX
micro-ATX (шириной до 215 мм)
mini-DTX
Mini-ITX
SFX
TFX
серверный
```

### Материал (`material`) — select

**⚠️ Подозрительные значения:**
- `пластик, металл, дерево, стекло`
- `пластик, металл, стекло, кожа`

Всего значений: 23

```
алюминий, пластик
металл
металл, дерево
металл, дерево, стекло
металл, стекло
пластик
пластик, металл
пластик, металл, дерево
пластик, металл, дерево (боковая стенка из сетки)
пластик, металл, дерево, стекло
пластик, металл, стекло
пластик, металл, стекло, кожа
сталь
сталь (+ пластик)
сталь (+пластик)
сталь (+пластик+резина)
сталь (акриловая боковая панель)
сталь, алюминий
сталь, пластик
сталь, пластик (акриловая боковая панель)
сталь, пластик, стекло
сталь, пластик, стекло (акриловая боковая панель)
сталь, стекло
```

### Передняя панель (`material_front`) — select

Всего значений: 14

```
дерево с забором воздуха
металл
металл с забором воздуха
пластик
пластик с забором воздуха
пластик с забором воздуха, стекло
пластик, стекло
сетка
сетка (нейлон)
сетка, металл
сетка, металл с забором воздуха
сетка, пластик
стекло
стекло с забором воздуха
```

### Боковая панель (`window`) — select

Всего значений: 3

```
Нет
(закаленное стекло)
Стекло
```

### Макс. высота кулера, мм (`max_cooler_height`) — range


### Макс. длина ВК, мм (`max_gpu_length`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Охлаждение (`coolers`)

### Тип (`type`) — select

Всего значений: 4

```
вентилятор для корпуса
вентилятор для сервера
кулер для процессора
пассивное
```

### Сокет (`socket`) — select

Всего значений: 32

```
AM1
AM2
AM2+
AM3
AM3+
AM4
AM5
FM1
FM2
FM2+
LGA1150
LGA1151
LGA1151-2
LGA1155
LGA1156
LGA1200
LGA1356
LGA1366
LGA1700
LGA1851
LGA2011
LGA2011-3
LGA2011-3 Narrow ILM
LGA2011-3 Square ILM
LGA2066
LGA3647
LGA4189
LGA775
SP3
TR4
TRX4
WRX8
```

### TDP, Вт (`tdp`) — range


### Вентилятор, мм (`fan_size`) — range


### Кол-во вентиляторов (`fan_count`) — range


### Шум, дБ (`noise`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Мониторы (`monitors`)

### Диагональ, " (`diagonal`) — range


### Соотношение сторон (`aspect_ratio`) — select

Всего значений: 3

```
16:10
16:9
21:9
```

### Изогнутый экран (`curved`) — select

Всего значений: 2

```
Изогнутый
Плоский
```

### Синхронизация (`sync_technology`) — select

Всего значений: 7

```
AMD FreeSync
AMD FreeSync Premium
AMD FreeSync, AMD FreeSync Premium Pro, VESA Adaptive-Sync
AMD FreeSync, NVIDIA G-Sync Ultimate
AMD FreeSync, совместимый с NVIDIA G-Sync
VESA Adaptive-Sync
совместимый с NVIDIA G-Sync, VESA Adaptive-Sync
```

### Разрешение (`resolution`) — select

Всего значений: 11

```
1600x900
1920x1080
1920x1200
2560x1080
2560x1440
2560x1600
3440x1440
3840x1080
3840x2160
5120x1440
5120x2880
```

### Частота, Гц (`refresh_rate`) — range


### Матрица (`matrix`) — select

Всего значений: 4

```
IPS
OLED
TN+Film
VA
```

### Тип (`type`) — select

Всего значений: 4

```
домашний/офисный
игровой
портативный
профессиональный
```

### Яркость, кд/м² (`brightness`) — range


### Отклик, мс (`response_time`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Клавиатуры (`keyboards`)

### Тип/типоразмер (`type`) — select

Всего значений: 6

```
1800
60%
65%
75%
80% (TKL)
96/90%
```

### Интерфейс (`interface`) — select

**⚠️ Подозрительные значения:**
- `USB-A, USB-C, радио (USB-A), Bluetooth`
- `USB-A, радио, Bluetooth, USB-C`

Всего значений: 14

```
Bluetooth
USB
USB-A
USB-A, Bluetooth
USB-A, USB-C, радио (USB-A), Bluetooth
USB-A, радио (USB-A), Bluetooth
USB-A, радио, Bluetooth
USB-A, радио, Bluetooth, USB-C
USB-C
USB-C, радио (USB-C), Bluetooth
USB, Bluetooth
USB, радио, Bluetooth
радио
радио, Bluetooth
```

### Подключение (`connection_type`) — select

Всего значений: 3

```
беспроводная
проводная
проводная и беспроводная
```

### Беспроводной протокол (`wireless_protocols`) — select

Всего значений: 3

```
2.4 GHz
Bluetooth
Bluetooth, 2.4 GHz
```

### Цвет (`color`) — select

**⚠️ Подозрительные значения:**
- `серый, мятный, оранжевый, прозрачный`
- `черный, серый, белый, желтый`

Всего значений: 37

```
бежевый, голубой, сиреневый
белый
белый, бежевый
белый, зеленый
белый, зеленый, коричневый
белый, зеленый, розовый
белый, серебристый
белый, серый
белый, серый, желтый
белый, синий
белый, темно-серый
белый, темно-синий
белый, темно-синий, фиолетовый
голубой, черный
желтый
серебристый
серебристый, черный
серый
серый, бежевый
серый, белый
серый, зеленый
серый, мятный, оранжевый, прозрачный
серый, прозрачный
серый, черный
синий
темно-серый
черный
черный, бежевый
черный, бирюзовый
черный, зеленый
черный, красный
черный, прозрачный
черный, серый
черный, серый, бежевый
черный, серый, белый, желтый
черный, серый, зеленый
черный, серый, оранжевый
```

### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Мыши (`mice`)

### Тип (`type`) — select

Всего значений: 4

```
3D-мышь
игровая мышь
с нажатием
с нажатием и отклонением
```

### Интерфейс (`interface`) — select

**⚠️ Подозрительные значения:**
- `проводная USB Type-A, проводная USB Type-C, беспроводная Bluetooth, беспроводная радио`

Всего значений: 20

```
Bluetooth
беспроводная Bluetooth
беспроводная Bluetooth, беспроводная радио
беспроводная радио
беспроводная радио/Bluetooth
проводная USB
проводная USB Type-A
проводная USB Type-A, беспроводная Bluetooth, беспроводная радио
проводная USB Type-A, беспроводная радио
проводная USB Type-A, проводная USB Type-C, беспроводная Bluetooth, беспроводная радио
проводная USB Type-A, проводная USB Type-C, беспроводная радио
проводная USB, беспроводная радио
проводная USB, беспроводная радио/Bluetooth
проводная USB, проводная USB Type-C
проводная USB, радио
проводная USB, радио, радио/Bluetooth
проводная USB, радио/Bluetooth
радио
радио, Bluetooth
радио/Bluetooth
```

### Подключение (`connection_type`) — select

Всего значений: 3

```
беспроводная
проводная
проводная и беспроводная
```

### Беспроводной протокол (`wireless_protocols`) — select

Всего значений: 3

```
2.4 GHz
Bluetooth
Bluetooth, 2.4 GHz
```

### Цвет (`color`) — select

Всего значений: 36

```
бежевый
белый
белый, желтый
белый, серый
белый, цветной принт
белый, черный
белый, черный, цветной принт
бирюзовый
голубой
желтый
желтый, серый
зеленый
зеленый (мятный)
зеленый, черный
золотистый, черный
красный
красный, розовый
красный, черный
оранжевый, черный
рисунок, черный
розовый
серебристый, черный
серый
серый (песочный)
серый, черный
синий
синий, черный
сиреневый
темно-серый
темно-серый, черный
темно-синий
цветной принт
черный
черный, зеленый
черный, серый
черный, цветной принт
```

### DPI (`dpi`) — range


### Дата выхода, г (`data_vykhoda_na_rynok`) — range


## Наушники (`headphones`)

### Тип (`type`) — select

Всего значений: 13

```
встроенный в корпус
гибкий держатель
гибкий держатель, выдвижной держатель
гибкий держатель, поворотный держатель
гибкий держатель, съемный держатель
гибкий держатель, съемный держатель, встроенный в корпус
мониторные (охватывающие)
на проводе
накладные
поворотные чашки (1)
поворотные чашки, складное оголовье
поворотный держатель
съемный держатель
```

### Форм-фактор (`form_factor`) — select

Всего значений: 2

```
накладные
полноразмерные
```

### Тип подключения (`connection_type`) — select

Всего значений: 3

```
Bluetooth
радио
радио/Bluetooth
```

### Диаметр драйвера, мм (`driver_size`) — range


### Сопротивление, Ом (`impedance`) — range


### Цвет (`color`) — select

Всего значений: 43

```
бежевый
бежевый, золотистый
бежевый, прозрачный
бежевый, серебристый
белый
белый, желтый, прозрачный
белый, прозрачный
белый, серебристый
белый, серебристый, серый
белый, серый
белый, сиреневый
белый, черный
голубой
голубой, салатовый
желтый
зеленый
коричневый, черный
красный
кремовый
оранжевый, прозрачный
прозрачный
прозрачный, розовый
прозрачный, серебристый
прозрачный, синий
розовый
розовый, синий
серебристый
серый
серый, черный
синий
сиреневый
темно-серый
темно-синий
фиолетовый
черный
черный, графит
черный, желтый
черный, зеленый
черный, красный
черный, прозрачный
черный, серый
черный, синий
черный, темно-серый
```

### Дата выхода, г (`data_vykhoda_na_rynok`) — range

