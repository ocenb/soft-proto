// Задание 2. Работа с Promise
// Цепочка асинхронных операций через .then() и обработка ошибок через .catch().

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

function fetchData(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Имитация двух эндпоинтов
      if (url === '/api/users') {
        resolve(users);
        return;
      }

      if (url.startsWith('/api/users/')) {
        const id = Number(url.split('/').pop());
        const user = users.find((item) => item.id === id);

        if (user) {
          resolve(user);
        } else {
          reject(new Error(`Пользователь с id=${id} не найден`));
        }
        return;
      }

      reject(new Error(`Неизвестный URL: ${url}`));
    }, 2000);
  });
}

fetchData('/api/users')
  .then((userList) => {
    console.log('Список пользователей:', userList);

    if (!userList.length) {
      throw new Error('Список пользователей пуст');
    }

    const firstUserId = userList[0].id;
    // Второй "запрос" зависит от результата первого
    return fetchData(`/api/users/${firstUserId}`);
  })
  .then((firstUser) => {
    console.log('Первый пользователь:', firstUser);
  })
  .catch((error) => {
    console.error('Ошибка в цепочке Promise:', error.message);
  });
