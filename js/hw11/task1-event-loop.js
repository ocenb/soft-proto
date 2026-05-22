// Задание 1. Понимание Event Loop
// Демонстрация порядка выполнения: синхронный код -> микрозадачи (Promise.then) -> макрозадачи (setTimeout)

console.log('1) Синхронный код: старт скрипта');

setTimeout(() => {
  // setTimeout попадает в очередь макрозадач (task queue)
  console.log('4) setTimeout callback (макрозадача)');
}, 0);

Promise.resolve()
  .then(() => {
    // then попадает в очередь микрозадач (microtask queue)
    console.log('3) Promise.then callback (микрозадача)');
  });

console.log('2) Синхронный код: конец скрипта');

// Ожидаемый порядок вывода:
// 1) Синхронный код: старт скрипта
// 2) Синхронный код: конец скрипта
// 3) Promise.then callback (микрозадача)
// 4) setTimeout callback (макрозадача)
