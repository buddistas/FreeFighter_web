# Тесты FreeFighter

Эта папка предназначена для тестов проекта.

## Структура тестов

### Android тесты

Android тесты находятся в соответствующих папках Android-проекта:
- `android/app/src/test/` - Unit тесты (JUnit)
- `android/app/src/androidTest/` - Instrumented тесты (AndroidJUnit)

### Веб тесты

В этой папке можно добавить тесты для веб-логики игры:
- Unit тесты для `game.js`
- Тесты игровой механики
- Тесты классов Fighter и Game

## Запуск тестов

### Android Unit тесты
```bash
cd android
./gradlew test
```

### Android Instrumented тесты
```bash
cd android
./gradlew connectedAndroidTest
```
Требует подключенное устройство или запущенный эмулятор.

### Веб тесты
(Будут добавлены при необходимости)

## Примеры тестов

### Android Unit тест
Пример находится в `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`

### Android Instrumented тест
Пример находится в `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`

## Добавление новых тестов

При добавлении тестов для Android, следуйте структуре существующих тестов и обновите package name на `com.freefighter.app` вместо `com.getcapacitor.myapp`.

